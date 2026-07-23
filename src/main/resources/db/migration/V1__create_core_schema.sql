-- Core schema per docs/expense-settlement-app-tech-spec.md §3.2.
-- Reproduced verbatim - do not "simplify" or "improve" this without
-- flagging the change and getting it approved first (see CLAUDE.md).

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
