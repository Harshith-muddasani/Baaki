-- Postgres does not auto-index foreign key columns (unlike primary keys).
-- Profiled BalanceRepository's aggregate query with EXPLAIN (ANALYZE, BUFFERS)
-- against a synthetic 200k-expense / 400k-split / 50k-settlement dataset and
-- found two real full sequential scans:
--   - expenses, filtered by group_id (Rows Removed by Filter: 66540/worker)
--   - settlements, filtered by group_id (Rows Removed by Filter: 49905)
-- expense_splits.expense_id is NOT indexed here on purpose - it's already
-- the leading column of the existing UNIQUE(expense_id, user_id) constraint,
-- so a separate index would be redundant. settlements.paid_by/paid_to are
-- also deliberately left unindexed: they're only ever used as GROUP BY keys
-- on an already-filtered-by-group_id subset in this codebase, never as a
-- filter predicate, so an index on them wouldn't be used by any real query.
--
-- group_members.user_id is a different case: findByMemberUserId (added for
-- the "list only my groups" endpoint) filters by user_id alone, which isn't
-- covered by the (group_id, user_id) primary key since user_id is the
-- trailing column - that lookup was a full table scan too.
--
-- Measured impact - see docs/benchmarks.md for the full before/after.

CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_settlements_group_id ON settlements(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
