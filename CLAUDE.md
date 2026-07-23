# Expense Settlement App — Project Memory

@docs/expense-settlement-app-tech-spec.md

## Build & test
- `./gradlew bootRun` — run locally (requires Docker Compose stack up)
- `docker compose up -d` — starts Postgres + Redis (+ Kafka in v2)
- `./gradlew test` — unit + Testcontainers integration tests

## Non-negotiable conventions
- Money is always `BIGINT` minor units (paise). Never `float`/`double`, ever.
- `expenses`, `expense_splits`, `settlements` are append-only. Never write
  code that UPDATEs or hard-DELETEs a row in these tables — soft-delete only.
- Any new endpoint that creates a side effect (settlement, payment) needs an
  idempotency key. No exceptions.
- Current scope is a monolith. Do not introduce a second service until §14
  (notification service) is explicitly being built.

## Commit cadence for this project
- Commit at each checkpoint in the Build Order Checklist (§13/§14), not
  just once at the end of a week. A single week's work should produce
  several atomic commits, not one.
- Reference the relevant spec section in commit bodies when a commit
  implements a specific design decision, e.g.:
    feat(ledger): add expense_splits table per §3.2

    Ledger design chosen over mutable balance column — see §7 for the
    concurrency/auditability trade-off.
- At the end of each week, the commit that closes out that week's
  checklist items should also update the checkbox in the spec doc itself.
  
## Where things live
- Domain logic: `src/main/java/.../service/`
- Split/settlement algorithms: `src/main/java/.../algorithm/`
- Schema migrations: `src/main/resources/db/migration/`