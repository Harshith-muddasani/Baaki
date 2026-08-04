-- Permanent load-test dataset, kept deliberately separate from the
-- business-realistic demo seed in V2 - including its OWN dedicated users,
-- so it never shows up in any real demo user's Dashboard/Groups pages.
-- Named "Load Test Group N" / "Load Test User N" on purpose - this is
-- synthetic scale data for exercising BalanceRepository's aggregate query
-- and the balance_cache read-through path at real volume, not something
-- meant to pass as an organic group. See docs/benchmarks.md for the
-- methodology and the numbers measured against this exact dataset.
--
-- 8 dedicated users, 500 groups / 200k expenses / ~400k expense_splits /
-- 50k settlements among them.

INSERT INTO users (name, email, password_hash, created_at)
SELECT 'Load Test User ' || g, 'load-test-user-' || g || '@example.internal',
       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', now()
FROM generate_series(1, 8) g;

INSERT INTO groups (name, created_by, created_at)
SELECT 'Load Test Group ' || g, lu.id, now()
FROM generate_series(1, 500) g
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM users WHERE email LIKE 'load-test-user-%@example.internal') lu
    ON lu.rn = (g - 1) % 8;

INSERT INTO group_members (group_id, user_id, joined_at)
SELECT lg.id, lu.id, now()
FROM (SELECT id FROM groups WHERE name LIKE 'Load Test Group %') lg
CROSS JOIN (SELECT id FROM users WHERE email LIKE 'load-test-user-%@example.internal') lu;

INSERT INTO expenses (group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at)
SELECT
    lg.id,
    payer.id,
    'Load test expense ' || e,
    (100 + (e % 5000)) * 100,
    'INR',
    'EQUAL',
    payer.id,
    now()
FROM generate_series(1, 200000) e
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM groups WHERE name LIKE 'Load Test Group %') lg
    ON lg.rn = (e - 1) % 500
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM users WHERE email LIKE 'load-test-user-%@example.internal') payer
    ON payer.rn = (e - 1) % 8;

-- two splits per expense: the payer, and the "next" load-test user in
-- rotation - recovered by looking the payer's rank back up, not stored.
INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at)
SELECT ex.id, partner.id, ex.total_amount / 2, now()
FROM expenses ex
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM users WHERE email LIKE 'load-test-user-%@example.internal') payer_rank
    ON payer_rank.id = ex.paid_by
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM users WHERE email LIKE 'load-test-user-%@example.internal') partner
    ON partner.rn = (payer_rank.rn + 1) % 8
WHERE ex.description LIKE 'Load test expense %'
UNION ALL
SELECT ex.id, ex.paid_by, ex.total_amount - (ex.total_amount / 2), now()
FROM expenses ex WHERE ex.description LIKE 'Load test expense %';

INSERT INTO settlements (group_id, paid_by, paid_to, amount, idempotency_key, status, created_at)
SELECT lg.id, payer.id, receiver.id, (500 + (s % 2000)) * 100, gen_random_uuid(), 'COMPLETED', now()
FROM generate_series(1, 50000) s
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM groups WHERE name LIKE 'Load Test Group %') lg
    ON lg.rn = (s - 1) % 500
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM users WHERE email LIKE 'load-test-user-%@example.internal') payer
    ON payer.rn = (s - 1) % 8
JOIN (SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM users WHERE email LIKE 'load-test-user-%@example.internal') receiver
    ON receiver.rn = s % 8;
