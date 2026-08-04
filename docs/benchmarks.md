# Performance Benchmark — Balance Computation

## Dataset

`V4__load_test_dataset.sql` (Flyway location `db/loadtest`, kept out of the
default `db/migration` path so the Testcontainers test suite never pays for
it) permanently seeds 8 dedicated "Load Test User N" accounts, 500 "Load
Test Group N" groups, 200,000 expenses, ~400,000 expense_splits, and 50,000
settlements into the dev database. It has its own users on purpose, not
the real demo's 8 - so this data never shows up in any real demo user's
Dashboard/Groups pages. Named plainly ("Load Test Group N") rather than
disguised as an organic group.

Every number below is measured against `Load Test Group 1` (id 1506 in the
current database), using `EXPLAIN (ANALYZE, BUFFERS)` on the exact
production queries (`BalanceRepository.computeBalances` and the
`balance_cache` read path added this session).

## Why indexing mattered

Postgres auto-indexes primary keys, never foreign keys. Before
`V3__add_foreign_key_indexes.sql`, every filter in the balance query -
`group_id` on `expenses` and `settlements` - was a full sequential scan.
`group_members.user_id` (the trailing column of its composite primary key,
queried alone by `findByMemberUserId` for the "list only my groups"
endpoint) had the same problem.

| Step | Execution time |
|---|---|
| No index (`group_id` filters do a full sequential scan) | **23.236 ms** |
| After `CREATE INDEX` on `expenses.group_id`, `settlements.group_id`, `group_members.user_id` (+ `ANALYZE`) | **5.26 ms** (5.56 ms on the first post-ANALYZE run) |

**~4.4x faster** from three targeted indexes - deliberately not indexing
`expense_splits.expense_id` (already the leading column of an existing
unique constraint) or `settlements.paid_by`/`paid_to` (never used as a
filter predicate anywhere in this codebase, only as a `GROUP BY` key on an
already-filtered subset - an index there would sit unused).

## Why the cache read-through mattered

`balance_cache` existed from early in the project (materialized by an
`AFTER_COMMIT` event listener after every expense/settlement write) but
nothing ever *read* from it - `GET /balances` always recomputed live,
making the cache table pure dead weight. This session wired up the actual
read-through (`BalanceService`), with a completeness check instead of
blind trust: if the cache doesn't have a row for every current group
member (a brand-new group, or a member added since the last write), it
falls back to a live compute and warms the cache - see the class-level
Javadoc on `BalanceService.getBalances` and `BalanceServiceTest` for the
three scenarios that check this precisely (full-cache hit, cold cache,
partial-cache-from-a-new-member).

| Path | Execution time |
|---|---|
| Live aggregate query, indexed | 5.26 ms |
| `balance_cache` read (single indexed lookup) | **0.126 ms** |

**~42x faster** than the indexed live query, **~184x faster** than the
original unindexed one.

## Reproducing this

```
docker exec -i baaki-postgres psql -U baaki -d baaki -c \
  "SELECT id FROM groups WHERE name = 'Load Test Group 1';"
# EXPLAIN (ANALYZE, BUFFERS) the query in BalanceRepository for that id,
# then again for: SELECT * FROM balance_cache WHERE group_id = <id>
# after hitting GET /groups/<id>/balances once to warm it.
```

## Removing it for a production/public deploy

Its own dedicated users mean this is safe to strip out without touching
any real data - the indexes from V3 are independently valuable and should
stay:

```sql
DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE description LIKE 'Load test expense %');
DELETE FROM expenses WHERE description LIKE 'Load test expense %';
DELETE FROM settlements WHERE group_id IN (SELECT id FROM groups WHERE name LIKE 'Load Test Group %');
DELETE FROM balance_cache WHERE group_id IN (SELECT id FROM groups WHERE name LIKE 'Load Test Group %');
DELETE FROM group_members WHERE group_id IN (SELECT id FROM groups WHERE name LIKE 'Load Test Group %');
DELETE FROM groups WHERE name LIKE 'Load Test Group %';
DELETE FROM users WHERE email LIKE 'load-test-user-%@example.internal';
```
