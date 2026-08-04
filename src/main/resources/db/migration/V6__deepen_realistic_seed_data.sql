-- Two realism gaps found by checking the deployed demo's actual computed
-- balances (GET /groups/{id}/balances):
--
-- 1. Office Lunch Club had only 4 expenses despite being "founded" in
--    March 2026 - a lunch club running for months with 4 line items reads
--    as obviously seeded. Adds weekly team lunches + biweekly coffee runs
--    through July, rotating payer, same "amounts divisible by member
--    count" discipline as V5 (4 members here, so all amounts are
--    multiples of 400 minor units).
--
-- 2. V5's year of Flatmates bills was never settled, so Raj's balance had
--    grown to net_balance = +37,468,566 paise (~Rs 3.75 lakh) - not
--    remotely realistic for flatmates who actually live together. Adds
--    five bimonthly settlements (Sanya and Arjun each paying Raj a round
--    amount), leaving a plausible ~2-months'-worth residual instead of a
--    year's worth.

-- ============================================================
-- Office Lunch Club (group 3): weekly lunches + biweekly coffee runs
-- ============================================================
WITH new_expenses AS (
    INSERT INTO expenses (group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at)
    SELECT
        3,
        (ARRAY[3, 6, 7, 8])[(w % 4) + 1],
        (ARRAY['Team lunch - Truffles', 'Team lunch - Meghana Foods', 'Team lunch - Empire Restaurant', 'Team lunch - Toit'])[(w % 4) + 1],
        320000 + (w * 4000),
        'INR', 'EQUAL',
        (ARRAY[3, 6, 7, 8])[(w % 4) + 1],
        (make_date(2026, 3, 13) + (w * interval '7 days'))::timestamptz
    FROM generate_series(0, 17) w
    UNION ALL
    SELECT
        3,
        (ARRAY[6, 8, 3, 7])[(c % 4) + 1],
        (ARRAY['Coffee run - CCD', 'Coffee run - Starbucks', 'Coffee run - Third Wave Coffee', 'Coffee run - Blue Tokai'])[(c % 4) + 1],
        80000 + (c * 800),
        'INR', 'EQUAL',
        (ARRAY[6, 8, 3, 7])[(c % 4) + 1],
        (make_date(2026, 3, 20) + (c * interval '14 days'))::timestamptz
    FROM generate_series(0, 8) c
    RETURNING id, total_amount, created_at
)
INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at)
SELECT ne.id, member.user_id, ne.total_amount / 4, ne.created_at
FROM new_expenses ne
CROSS JOIN (VALUES (3), (6), (7), (8)) AS member(user_id);

-- ============================================================
-- Flatmates (group 2): bimonthly settlements so the balance reads as an
-- ongoing household that actually settles up, not a year of pure debt.
-- ============================================================
INSERT INTO settlements (group_id, paid_by, paid_to, amount, idempotency_key, status, created_at) VALUES
    (2, 5, 2, 3000000, gen_random_uuid(), 'COMPLETED', '2025-09-05T19:00:00+05:30'),
    (2, 6, 2, 2800000, gen_random_uuid(), 'COMPLETED', '2025-09-05T19:05:00+05:30'),
    (2, 5, 2, 3000000, gen_random_uuid(), 'COMPLETED', '2025-11-05T19:00:00+05:30'),
    (2, 6, 2, 2800000, gen_random_uuid(), 'COMPLETED', '2025-11-05T19:05:00+05:30'),
    (2, 5, 2, 3000000, gen_random_uuid(), 'COMPLETED', '2026-01-05T19:00:00+05:30'),
    (2, 6, 2, 2800000, gen_random_uuid(), 'COMPLETED', '2026-01-05T19:05:00+05:30'),
    (2, 5, 2, 3000000, gen_random_uuid(), 'COMPLETED', '2026-03-05T19:00:00+05:30'),
    (2, 6, 2, 2800000, gen_random_uuid(), 'COMPLETED', '2026-03-05T19:05:00+05:30'),
    (2, 5, 2, 3000000, gen_random_uuid(), 'COMPLETED', '2026-05-05T19:00:00+05:30'),
    (2, 6, 2, 2800000, gen_random_uuid(), 'COMPLETED', '2026-05-05T19:05:00+05:30');
