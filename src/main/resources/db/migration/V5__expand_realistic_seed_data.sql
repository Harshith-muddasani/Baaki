-- Expands the business-realistic demo seed (V2) with a year of recurring
-- monthly bills for the Flatmates group - a handful of one-off expenses per
-- group reads as "just seeded," a running household ledger reads as real
-- usage. All coefficients below are multiples of 3 by construction, so
-- every amount stays exactly divisible among the group's 3 members with no
-- rounding remainder to reason about.
--
-- Uses RETURNING to capture exactly these 48 new expense ids for the
-- splits insert below, rather than matching on description - V2 already
-- has a "Rent - March 2026" row in this same group, and a pattern loose
-- enough to describe "12 months of rent" would also match that one.

WITH new_expenses AS (
    INSERT INTO expenses (group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at)
    SELECT
        2, -- Flatmates - HSR Layout
        2, -- Raj pays rent every month
        'Rent - ' || to_char(make_date(2025, 7, 1) + (m * interval '1 month'), 'FMMonth YYYY'),
        4500000,
        'INR',
        'EQUAL',
        2,
        (make_date(2025, 7, 3) + (m * interval '1 month'))::timestamptz
    FROM generate_series(0, 11) m
    UNION ALL
    SELECT
        2, 5, -- Sanya pays electricity
        'Electricity bill - ' || to_char(make_date(2025, 7, 1) + (m * interval '1 month'), 'FMMonth YYYY'),
        210000 + (m * 3000),
        'INR', 'EQUAL', 5,
        (make_date(2025, 7, 5) + (m * interval '1 month'))::timestamptz
    FROM generate_series(0, 11) m
    UNION ALL
    SELECT
        2, 6, -- Arjun pays groceries
        'Groceries - ' || to_char(make_date(2025, 7, 1) + (m * interval '1 month'), 'FMMonth YYYY'),
        300000 + (m * 4500),
        'INR', 'EQUAL', 6,
        (make_date(2025, 7, 10) + (m * interval '1 month'))::timestamptz
    FROM generate_series(0, 11) m
    UNION ALL
    SELECT
        2, 2, -- Raj pays internet
        'Internet - Airtel Fiber - ' || to_char(make_date(2025, 7, 1) + (m * interval '1 month'), 'FMMonth YYYY'),
        149700 + (m * 300),
        'INR', 'EQUAL', 2,
        (make_date(2025, 7, 1) + (m * interval '1 month'))::timestamptz
    FROM generate_series(0, 11) m
    RETURNING id, total_amount, created_at
)
INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at)
SELECT ne.id, member.user_id, ne.total_amount / 3, ne.created_at
FROM new_expenses ne
CROSS JOIN (VALUES (2), (5), (6)) AS member(user_id);
