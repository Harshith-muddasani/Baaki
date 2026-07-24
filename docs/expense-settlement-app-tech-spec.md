# Baaki — Full Technical Specification

Splitwise-style expense settlement backend. "Baaki" (बाक़ी) — Hindi/Urdu for "what remains owed" — is exactly what the debt-simplification engine computes. This is the reference doc for the full build — every decision here is one you should be able to defend in an interview, not just implement.

---

## 1. Tech Stack & Justification

| Layer | Choice | Why | Rejected alternative |
|---|---|---|---|
| Language | Java 21 (LTS) | Matches your target stack; virtual threads (Project Loom) are a nice talking point if you want to mention them | Kotlin — nicer syntax, but adds a "why not just Java" question you don't need in an interview |
| Framework | Spring Boot 3.x | Industry standard at Indian product companies; Spring Data JPA + Validation + Web cover 90% of this project | Micronaut/Quarkus — faster startup, but less relevant to what interviewers ask about |
| Database | PostgreSQL | Strong transactional guarantees, native `NUMERIC` type for money, window functions for aggregation, row-level locking support | MySQL (weaker default isolation semantics); MongoDB (this data is inherently relational — groups, members, splits — forcing it into documents creates more problems than it solves) |
| Migrations | Flyway | Version-controlled schema, standard in production Java shops | Liquibase — more XML ceremony for no real benefit here |
| Caching / locking | Redis | Idempotency key storage, optional balance cache, distributed lock if you scale beyond one instance | None needed at this scale, but worth including for the resume signal |
| Build tool | Gradle | Faster incremental builds than Maven; slightly more modern default in new Java shops | Maven — also fine, pick whichever you already know |
| Testing | JUnit 5 + Mockito + **Testcontainers** | Testcontainers spins up a real Postgres in a Docker container during tests — this is the detail that signals maturity. Anyone can mock a repository; testing against a real database catches real bugs (constraint violations, actual rounding behavior) | H2 in-memory DB — convenient but lies to you; H2's SQL dialect quietly diverges from Postgres in ways that hide bugs |
| API docs | springdoc-openapi (Swagger UI) | Free, auto-generated, makes the project demoable without a frontend | Hand-written Postman collection — fine as a backup, but less impressive |
| Frontend | Minimal React SPA (Vite + plain CSS or Tailwind, no heavy component library) | You need *something* real people can click through to actually use it. Keep it deliberately thin — 4-5 screens: login, group view, add expense, balances, settle up | A "proper" full frontend — resist this. Every hour on frontend polish is an hour not spent on backend depth, and this is a backend portfolio piece |
| Containerization | Docker + Docker Compose (app + Postgres + Redis) locally | One-command local setup — a small thing that reviewers notice | — |
| CI | GitHub Actions (build + test on every push) | Cheap to set up, signals you think about engineering practice, not just code | — |
| Deployment | Railway or Render (free/hobby tier) + managed Postgres + Redis Cloud free tier | Actually reachable by real users — the whole point of choosing an "applicational" project | Self-hosted VPS — more control, but more time sunk into ops instead of the parts that matter for your resume |
| Observability | Spring Boot Actuator + Micrometer → Prometheus (Grafana optional) | Lets you produce real p50/p99 latency numbers for your resume bullet | — |

> **v2 addition:** Apache Kafka (via Spring Kafka) is introduced later, specifically for domain-event publishing to a separate notification service — see §14. It is deliberately *not* part of the MVP core; adding it on day one with no consumer to justify it would be the over-engineering mistake §2 warns against.

---

## 2. System Architecture — Monolith, Deliberately

One Spring Boot application. One database. No message queue, no microservices, no service mesh.

**This is a deliberate decision, not a shortcut — say this explicitly in your README.** A common junior mistake is reaching for microservices on a project with a handful of users, because it "looks more impressive." Interviewers who've actually operated distributed systems read that as a judgment red flag, not a skill signal — it tells them you'd over-engineer a real team's system too. The skill being tested in system design interviews is knowing **when** complexity is warranted, not defaulting to maximum complexity.

If you want to demonstrate you *understand* distributed concerns without over-building this specific project, do it in the README as a "how would this evolve at scale" section (see §7) rather than in the actual code.

```
┌─────────────┐      ┌──────────────────────────────┐      ┌────────────┐
│  React SPA  │─────▶│   Spring Boot Monolith        │─────▶│ PostgreSQL │
└─────────────┘      │  - Controllers (REST)         │      └────────────┘
                      │  - Services (business logic)  │
                      │  - Repositories (JPA)          │      ┌────────────┐
                      └──────────────┬─────────────────┘─────▶│   Redis    │
                                     │ (idempotency keys,      └────────────┘
                                     │  optional balance cache)
                                     ▼
                              Actuator/Micrometer
                                     │
                                     ▼
                                Prometheus
```

---

## 3. Data Model

### 3.1 Design Principle — Ledger, Not Balances

**The single most important decision in this project:** expenses and settlements are **immutable, append-only records**. You never store or mutate a `balance` column that gets incremented/decremented on every transaction. Balances are *derived* by aggregating the ledger.

Why this matters:
- **Correctness under concurrency**: two simultaneous expense additions are just two independent `INSERT`s — no read-modify-write race, no lost updates. A mutable balance column requires locking on every write to avoid exactly this race.
- **Auditability**: you can always answer "why is this balance what it is" by replaying the ledger. A mutable balance can't tell you its own history.
- **Correcting mistakes safely**: if a split calculation had a bug, you can fix the aggregation logic and recompute — you haven't destroyed the underlying facts.

This is standard practice in real fintech backends (event-sourcing-lite), and explicitly designing for it — even at small scale — is a strong signal of engineering maturity beyond your YOE.

### 3.2 Schema (PostgreSQL DDL)

```sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE groups (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
    group_id  BIGINT NOT NULL REFERENCES groups(id),
    user_id   BIGINT NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- The ledger. Immutable except for the soft-delete flag.
CREATE TABLE expenses (
    id           BIGSERIAL PRIMARY KEY,
    group_id     BIGINT NOT NULL REFERENCES groups(id),
    paid_by      BIGINT NOT NULL REFERENCES users(id),
    description  VARCHAR(255) NOT NULL,
    total_amount BIGINT NOT NULL,           -- minor units (paise), NEVER float
    currency     CHAR(3) NOT NULL DEFAULT 'INR',
    split_type   VARCHAR(20) NOT NULL,      -- EQUAL | EXACT | PERCENTAGE | SHARES
    created_by   BIGINT NOT NULL REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted   BOOLEAN NOT NULL DEFAULT false   -- soft delete only, never hard-delete financial rows
);

-- One row per person per expense: "user X owes share_amount for expense Y"
-- Computed and stored AT WRITE TIME, not recalculated later.
CREATE TABLE expense_splits (
    id            BIGSERIAL PRIMARY KEY,
    expense_id    BIGINT NOT NULL REFERENCES expenses(id),
    user_id       BIGINT NOT NULL REFERENCES users(id),
    share_amount  BIGINT NOT NULL,          -- minor units, this user's owed portion
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (expense_id, user_id)
);

-- Actual repayments between members. Also immutable/append-only.
CREATE TABLE settlements (
    id               BIGSERIAL PRIMARY KEY,
    group_id         BIGINT NOT NULL REFERENCES groups(id),
    paid_by          BIGINT NOT NULL REFERENCES users(id),
    paid_to          BIGINT NOT NULL REFERENCES users(id),
    amount           BIGINT NOT NULL,
    idempotency_key  UUID NOT NULL UNIQUE,   -- prevents double-settlement on retry
    status           VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OPTIONAL: materialized cache for fast reads on large groups.
-- Invalidated/recomputed whenever expenses or settlements change for that group.
CREATE TABLE balance_cache (
    group_id        BIGINT NOT NULL REFERENCES groups(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    net_balance     BIGINT NOT NULL,          -- positive = owed money, negative = owes money
    version         INT NOT NULL DEFAULT 0,   -- optimistic locking
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
```

### 3.3 Why `BIGINT` for money, never `FLOAT`/`DOUBLE`

Floating point cannot represent most decimal fractions exactly (₹0.1 + ₹0.2 ≠ ₹0.3 in IEEE 754). Store every amount as an integer count of the smallest currency unit (paise, cents). Do arithmetic in integers. Only format to decimal display (`₹123.45`) at the API/UI boundary. This is a one-line schema decision that most junior implementations get wrong, and interviewers notice immediately if you get it right unprompted.

---

## 4. API Design

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| `POST` | `/auth/register`, `/auth/login` | Account creation, JWT issuance | Keep auth minimal — this isn't the point of the project |
| `POST` | `/groups` | Create a group | |
| `POST` | `/groups/{id}/members` | Add a member | |
| `POST` | `/groups/{id}/expenses` | Add an expense with a split | Body includes `splitType` + per-user shares (see §5.1) |
| `GET` | `/groups/{id}/expenses` | List ledger entries | Paginated |
| `GET` | `/groups/{id}/balances` | Net balance per member | Computed live or from cache |
| `GET` | `/groups/{id}/settlements/suggestions` | Debt-simplified minimal transaction set | This is the algorithm endpoint — the one you'll demo in interviews |
| `POST` | `/groups/{id}/settlements` | Record an actual repayment | **Requires an `Idempotency-Key` header** — reject duplicate keys with the original response, not a new insert |
| `GET` | `/users/{id}/activity` | Cross-group activity feed | Nice-to-have |

---

## 5. Core Algorithms

### 5.1 Split Calculation & the Rounding Problem

Four split types: `EQUAL`, `EXACT` (caller specifies amounts), `PERCENTAGE`, `SHARES` (weighted, e.g. 2:1:1).

**The bug almost everyone writes on their first attempt:** splitting ₹100 three ways gives ₹33.33 each — but 33.33 × 3 = 99.99, not 100. Somebody has to absorb the missing paisa.

Deterministic fix: compute the floor division for everyone, sum the remainder, then distribute the leftover 1-paise units to the first N users **ordered by a stable key (e.g., user_id ascending)** — never by insertion order or hash order, which can vary between runs and make the result non-reproducible.

```java
public List<Split> splitEqually(long totalAmount, List<Long> userIds) {
    int n = userIds.size();
    long baseShare = totalAmount / n;
    long remainder = totalAmount % n;

    List<Long> sortedIds = userIds.stream().sorted().toList(); // stable, deterministic order
    List<Split> splits = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        long share = baseShare + (i < remainder ? 1 : 0); // first `remainder` users get +1 paisa
        splits.add(new Split(sortedIds.get(i), share));
    }
    return splits;
}
```

Invariant to always assert in tests: `sum(splits) == totalAmount`, exactly, every time.

### 5.2 Balance Computation

For a given group and user:

```
net_balance(user) = SUM(expense_splits.share_amount WHERE paid_by = user, across all expenses in group)
                   − SUM(expense_splits.share_amount WHERE user_id = user, across all expenses in group)
                   + SUM(settlements.amount WHERE paid_to = user)
                   − SUM(settlements.amount WHERE paid_by = user)
```

Positive = this person is owed money. Negative = this person owes money. Do this as a single SQL aggregate query (window functions or `GROUP BY` + `SUM`) rather than pulling every row into the application and summing in Java — it's both faster and a better signal (shows you're comfortable pushing computation to the database where it belongs).

### 5.3 Debt Simplification — Greedy Two-Heap

**The algorithm, in full, with the reasoning you should be able to give out loud:**

Given net balances for a group, minimizing the exact number of settle-up transactions needed is equivalent to a set-partition-style problem — **NP-hard** in the general case. There is no known efficient algorithm that guarantees the mathematically minimum number of transactions for an arbitrary set of balances.

The industry-standard approach (this is what real Splitwise does) is a **greedy approximation**:

1. Split users into two max-heaps: **creditors** (net_balance > 0) and **debtors** (net_balance < 0, keyed by absolute value).
2. Pop the largest creditor and largest debtor.
3. Settle `min(creditor.amount, debtor.amount)` between them — record one transaction.
4. Whichever side has leftover balance, push it back onto its heap. The side that hit exactly zero is removed.
5. Repeat until both heaps are empty.

```java
public List<Settlement> simplifyDebts(Map<Long, Long> netBalances) {
    PriorityQueue<Balance> creditors = new PriorityQueue<>(Comparator.comparingLong(Balance::amount).reversed());
    PriorityQueue<Balance> debtors = new PriorityQueue<>(Comparator.comparingLong(Balance::amount).reversed());

    netBalances.forEach((userId, balance) -> {
        if (balance > 0) creditors.add(new Balance(userId, balance));
        else if (balance < 0) debtors.add(new Balance(userId, -balance));
    });

    List<Settlement> result = new ArrayList<>();
    while (!creditors.isEmpty() && !debtors.isEmpty()) {
        Balance creditor = creditors.poll();
        Balance debtor = debtors.poll();
        long settled = Math.min(creditor.amount(), debtor.amount());

        result.add(new Settlement(debtor.userId(), creditor.userId(), settled));

        if (creditor.amount() > settled) creditors.add(new Balance(creditor.userId(), creditor.amount() - settled));
        if (debtor.amount() > settled) debtors.add(new Balance(debtor.userId(), debtor.amount() - settled));
    }
    return result;
}
```

**Complexity:** O(n log n) — each of the n participants is pushed/popped a small constant number of times.

**Provable bound:** this greedy approach always produces at most `n − 1` transactions for `n` participants (since every transaction fully zeroes out at least one person). That's usually optimal or very close to it in practice, even though it isn't provably optimal in every adversarial case.

**Test this with adversarial inputs**, not just the happy path:
- A cycle of debt (A owes B, B owes C, C owes A equal amounts) — should collapse to zero transactions
- One person owes everyone (single mega-debtor)
- Everyone owes everyone roughly equally

---

## 6. Concurrency & Idempotency

| Concern | Problem | Solution |
|---|---|---|
| Two users add expenses to the same group at once | Naive mutable-balance design would race on read-modify-write | Solved by design — expenses are independent `INSERT`s, no shared mutable state to race on |
| Balance reads during concurrent writes | Reading balance mid-write could show a torn/inconsistent view | Postgres's default `READ COMMITTED` isolation is sufficient here since we're aggregating committed rows only |
| Retried settlement request (client network retry) | Could double-settle a payment | `Idempotency-Key` header, stored as a unique DB constraint on `settlements.idempotency_key`. On duplicate key, return the original response instead of inserting again |
| Balance cache going stale (if you implement §3.2's optional cache) | Two concurrent writes both recompute and overwrite the cache, one write "wins" incorrectly | Optimistic locking via the `version` column — write only succeeds if `version` matches what was read; otherwise recompute and retry |

---

## 7. Key Trade-offs — Write These Into Your README

This section is what actually separates this project from a tutorial clone. Document each decision and why, explicitly.

**1. Ledger vs. mutable balance column**
Ledger chosen — auditable, race-free on write, more computation needed on read (mitigated by optional cache). Mutable balance is simpler to read but structurally can't avoid write races and destroys history.

**2. Exact-optimal vs. greedy debt simplification**
Greedy chosen — exact minimum-transaction-count is NP-hard; greedy gives a provably bounded, practically-optimal result in O(n log n) at a fraction of the complexity.

**3. Synchronous vs. async settlement processing**
Synchronous chosen for this scope. If this evolved into a system handling real payment gateway integration or push notifications at scale, the natural next step is to publish a `SettlementCreated` event to a queue and let notification/reconciliation consumers process it asynchronously — mention this as the scaling path in your README without actually building it. (This is also a nice bridge if you ever build the message-queue project — you can literally point to this as "here's where I'd plug it in.")

**4. Monolith vs. microservices**
Monolith chosen deliberately — see §2. Splitting `users`, `groups`, `expenses` into separate services here would add network calls, distributed transaction complexity, and operational overhead with zero corresponding benefit at this scale. Say explicitly that you understand this trade-off; don't just default to simplicity by omission.

**5. SQL vs. NoSQL**
Postgres chosen — the data is inherently relational (users ↔ groups ↔ expenses ↔ splits), and you need real joins and aggregate queries. A document store would force you to either denormalize (duplicate data, risk drift) or do application-side joins (slower, more error-prone).

---

## 8. Common Pitfalls (Avoid These Explicitly)

- Using `float`/`double` for money → silent precision bugs
- Mutable `balance` column instead of a ledger → race conditions, no audit trail
- Hard-deleting expenses → breaks historical balance recalculation and audit trail; always soft-delete
- No idempotency key on the settlement endpoint → double-charging on retry
- Ignoring the rounding remainder in splits → sums that don't add up to the original total
- Reaching for microservices/Kafka/etc. on a project with a handful of users → reads as poor engineering judgment, not skill

---

## 9. Testing Strategy

- **Testcontainers** for integration tests — spin up real Postgres in Docker during the test run, not H2. This catches real constraint violations and real rounding/precision behavior.
- Unit tests must include the adversarial debt-simplification cases from §5.3, not just the happy path.
- Property-based test (if you want a stretch goal): generate random sets of balances, assert the invariant `sum(all balances) == 0` always holds after any split, and that `simplifyDebts` output always nets to the same balances.

---

## 10. Observability

- Spring Boot Actuator + Micrometer, scraped by Prometheus.
- Track at minimum: request latency (p50/p99) per endpoint, count of expenses created, count of settlements, count of idempotency-key rejections (duplicate retries).
- This is what turns "I built an expense app" into a resume bullet with real numbers, per your build plan's Week 5-6.

---

## 11. Deployment

- Docker Compose locally: app + Postgres + Redis, one command to run everything.
- Deployed instance: Railway or Render free tier for the app, managed Postgres (Neon/Supabase free tier also works well), Redis Cloud free tier.
- Actually onboard real users (your friend group, flatmates, office lunch group) — this is the step that makes "applicational project" true instead of aspirational. Don't skip it.

---

## 12. Interview Mapping — What Each Piece Lets You Talk About

| Project component | Interview round it prepares you for |
|---|---|
| Ledger vs. mutable balance design | System design / LLD — "design a system where correctness under concurrency matters" |
| Debt-simplification algorithm + NP-hardness reasoning | DSA round — greedy algorithm design and justification, shows CS depth beyond LeetCode pattern-matching |
| Idempotency key design | System design — this exact pattern is asked about in payments/distributed-systems-adjacent interviews |
| Schema design decisions (§3, §7) | LLD interviews — "design Splitwise" is itself a commonly asked LLD question at Indian product companies |
| Rounding/precision handling | Signals attention to correctness detail that's easy to skip past in a rushed take-home |
| Monolith-vs-microservices reasoning | System design — shows judgment about when complexity is warranted, not just "can you draw a microservices diagram" |

---

## 13. Build Order Checklist

- [x] **Week 1:** Schema (§3.2) + Flyway migrations + basic CRUD APIs
- [x] **Week 2:** Balance computation (§5.2) + rounding-safe split logic (§5.1) + unit tests
- [ ] **Week 3:** Debt-simplification algorithm (§5.3) + adversarial test cases
- [ ] **Week 4:** Idempotency (§6) + optimistic locking on cache (if implemented)
- [ ] **Week 5:** Deploy + onboard real users + fix what breaks under real usage
- [ ] **Week 6:** Observability (§10) + README (write §7's trade-offs explicitly) + finalize resume bullet
- [ ] **Week 7 (v2):** Kafka topic setup + event producer in the monolith — see §14
- [ ] **Week 8 (v2):** Notification consumer service + idempotent processing + dead-letter handling — see §14

---

## 14. Addendum: Event-Driven Notification Service (v2 Extension)

### 14.1 Why this piece — and only this piece — gets pulled out

The core ledger writes (expenses, splits, settlements) need strong consistency and stay in the monolith, exactly as §2 and §7 argue. Notifications ("your expense was added," "you were settled with") are inherently fire-and-forget and tolerant of a few seconds' delay — nobody's balance is wrong if their email arrives late. That asymmetry is the actual justification for decoupling this one path, not a desire to add Kafka to the resume. Say this explicitly in your v2 README.

### 14.2 Architecture

```
┌─────────────────────┐   publishes domain events    ┌──────────────────┐
│   Core Monolith      │ ────────────────────────────▶│  Kafka topic:     │
│  (ledger, splits,    │   ExpenseCreated               │  ledger-events    │
│   balances — stays   │   SettlementRecorded            │  (partitioned by  │
│   strongly consistent)│                                │   group_id)       │
└─────────────────────┘                                └─────────┬────────┘
                                                                   │ consumes
                                                                   ▼
                                                        ┌──────────────────────┐
                                                        │ Notification Service │
                                                        │ (separate deployable, │
                                                        │  consumer group:      │
                                                        │  "notification-svc")  │
                                                        │  sends email/push     │
                                                        └──────────────────────┘
```

### 14.3 Topic design

**One topic (`ledger-events`), not one-topic-per-event-type.** Each message carries an `eventType` field to distinguish `ExpenseCreated` from `SettlementRecorded`. Partition key: `groupId`.

Why: partitioning by `groupId` guarantees ordering *within a group* (Kafka only guarantees order within a partition) — so a group's events are always processed in the order they happened, which matters if a consumer ever needs to reconstruct group state from the event stream. A topic-per-event-type design would lose that cross-event-type ordering guarantee for the same group. Single topic also avoids topic sprawl as you add more event types later.

### 14.4 Event schema

```json
{
  "eventId": "a1b2c3d4-...",       // UUID, generated at publish time — used for consumer-side dedup
  "eventType": "ExpenseCreated",    // or "SettlementRecorded"
  "groupId": 42,
  "occurredAt": "2026-07-23T10:15:00Z",
  "payload": {
    "expenseId": 1001,
    "paidBy": 7,
    "totalAmount": 150000,
    "affectedUserIds": [7, 8, 9]
  }
}
```

`eventId` is the field that makes consumer-side idempotency possible — see §14.6.

### 14.5 Producer: the mistake almost everyone makes here

**Wrong (common) approach:** publish the Kafka event in the same service method as the database write, before the transaction commits. If the transaction later rolls back (e.g., a validation failure after the publish call), you've now sent a notification for an expense that doesn't exist — a "phantom event."

**MVP-correct approach:** publish only after the transaction commits. In Spring, use `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` so the Kafka publish only fires once the database write is durably committed.

**Production-correct approach (mention in README, don't have to build it):** the **transactional outbox pattern** — write the event to an `outbox` table in the *same* database transaction as the business write (so it's atomic with the ledger insert by construction), then a separate poller or CDC process (e.g., Debezium) reads the outbox table and publishes to Kafka, marking rows as sent. This removes even the small window of risk in the `AFTER_COMMIT` approach (app crashing between commit and publish). Explicitly noting "I used AFTER_COMMIT for MVP scope, and outbox would be the production hardening step" is a strong trade-off statement for an interview.

### 14.6 Consumer: idempotency is not optional

Kafka's default delivery guarantee is **at-least-once** — a consumer restart or rebalance can cause the same message to be redelivered. Since a notification isn't a no-op to receive twice (nobody wants two "you were settled with" emails), the consumer must track processed `eventId`s and skip duplicates:

- Maintain a small `processed_events` table (or a Redis set with a TTL matching your topic retention) keyed by `eventId`.
- On each message: check if `eventId` already processed → skip; otherwise process, then record.

Consumer group name: `notification-service`. If you ever run multiple instances of the notification service, Kafka automatically distributes partitions across them — this is a good talking point on horizontal scaling without extra code.

### 14.7 Failure handling

- If the notification service is down entirely for an hour, Kafka retains the events (this durability is the actual reason to use a log-based broker instead of a direct HTTP call or in-process async) — the consumer catches up automatically once it's back.
- After N failed processing attempts for a given message (e.g., the email provider is down), route it to a **dead-letter topic** (`ledger-events.DLT`) instead of retrying forever or dropping it. Have a small manual/scheduled replay path for the DLT.

### 14.8 Trade-offs to add to your v2 README

| Decision | Choice | Why |
|---|---|---|
| Delivery semantics | At-least-once + consumer-side dedup | Kafka's exactly-once transactions add real operational complexity (transactional producers, read-committed consumers) that isn't justified for a notification-only use case |
| Topic structure | Single topic, `eventType` field, partitioned by `groupId` | Preserves ordering within a group, avoids topic sprawl |
| Producer pattern | `AFTER_COMMIT` listener for MVP; outbox pattern documented as the production next step | Balances shipping speed against correctness; explicitly names the remaining gap instead of hiding it |

### 14.9 Interview mapping (extends §12)

| Project component | Interview round it prepares you for |
|---|---|
| Event-driven notification service | Message queue / distributed systems rounds — producer/consumer design, partition-key choice and ordering guarantees, idempotent consumption, outbox pattern awareness |
| The decision to split *only* notifications, not the whole system | System design judgment — shows you evaluate consistency requirements per-component instead of applying one architecture uniformly |
