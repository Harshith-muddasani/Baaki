-- Sample data for local development and demos: 8 users across 5 groups with
-- realistic expenses covering all four split types (EQUAL/EXACT/PERCENTAGE/
-- SHARES) and a few settlements. Explicit ids keep the data below easy to
-- read and cross-reference; sequences are reset to MAX(id) afterward so
-- real app usage continues cleanly from there.
--
-- Every expense_splits group sums exactly to its expense's total_amount,
-- including the 1-paisa remainder cases (distributed to the lowest user_id
-- first, per §5.1's rounding rule).

-- ============================================================
-- Users
-- ============================================================
INSERT INTO users (id, name, email, password_hash, created_at) VALUES
    (1, 'Priya Sharma',  'priya.sharma@gmail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-01T09:00:00+05:30'),
    (2, 'Raj Malhotra',  'raj.malhotra@gmail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-02T09:00:00+05:30'),
    (3, 'Ananya Iyer',   'ananya.iyer@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-03T09:00:00+05:30'),
    (4, 'Vikram Nair',   'vikram.nair@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-04T09:00:00+05:30'),
    (5, 'Sanya Kapoor',  'sanya.kapoor@gmail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-05T09:00:00+05:30'),
    (6, 'Arjun Reddy',   'arjun.reddy@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-06T09:00:00+05:30'),
    (7, 'Meera Joshi',   'meera.joshi@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-07T09:00:00+05:30'),
    (8, 'Karan Mehta',   'karan.mehta@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2026-05-08T09:00:00+05:30');

-- ============================================================
-- Groups
-- ============================================================
INSERT INTO groups (id, name, created_by, created_at) VALUES
    (1, 'Goa Trip 2026',              1, '2026-06-10T18:00:00+05:30'),
    (2, 'Flatmates - HSR Layout',     2, '2026-01-15T10:00:00+05:30'),
    (3, 'Office Lunch Club',          3, '2026-03-01T12:00:00+05:30'),
    (4, 'Diwali Party Planning',      4, '2026-07-20T20:00:00+05:30'),
    (5, 'Weekend Trek - Nandi Hills', 5, '2026-07-18T08:00:00+05:30');

-- ============================================================
-- Group members
-- ============================================================
INSERT INTO group_members (group_id, user_id, joined_at) VALUES
    (1, 1, '2026-06-10T18:00:00+05:30'),
    (1, 2, '2026-06-10T18:05:00+05:30'),
    (1, 3, '2026-06-10T18:07:00+05:30'),
    (1, 4, '2026-06-10T18:10:00+05:30'),

    (2, 2, '2026-01-15T10:00:00+05:30'),
    (2, 5, '2026-01-15T10:05:00+05:30'),
    (2, 6, '2026-01-15T10:10:00+05:30'),

    (3, 3, '2026-03-01T12:00:00+05:30'),
    (3, 6, '2026-03-01T12:05:00+05:30'),
    (3, 7, '2026-03-01T12:10:00+05:30'),
    (3, 8, '2026-03-01T12:15:00+05:30'),

    (4, 4, '2026-07-20T20:00:00+05:30'),
    (4, 1, '2026-07-20T20:05:00+05:30'),
    (4, 7, '2026-07-20T20:10:00+05:30'),
    (4, 8, '2026-07-20T20:15:00+05:30'),

    (5, 5, '2026-07-18T08:00:00+05:30'),
    (5, 2, '2026-07-18T08:05:00+05:30'),
    (5, 6, '2026-07-18T08:10:00+05:30');

-- ============================================================
-- Group 1: Goa Trip 2026 (Priya, Raj, Ananya, Vikram)
-- ============================================================
INSERT INTO expenses (id, group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at) VALUES
    (1, 1, 1, 'Flight tickets - IndiGo',    1800000, 'INR', 'EQUAL', 1, '2026-06-15T11:00:00+05:30'),
    (2, 1, 2, 'Taj Exotica - 3 nights',     4500000, 'INR', 'EQUAL', 2, '2026-06-20T15:00:00+05:30'),
    (3, 1, 3, 'Scuba diving package',        800000, 'INR', 'EQUAL', 3, '2026-06-21T10:00:00+05:30'),
    (4, 1, 4, 'Cab to/from airport',         215000, 'INR', 'EQUAL', 4, '2026-06-22T07:00:00+05:30'),
    (5, 1, 1, 'Dinner at Thalassa, Vagator', 623000, 'INR', 'EXACT', 1, '2026-06-21T21:00:00+05:30');

INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at) VALUES
    (1, 1, 450000, '2026-06-15T11:00:00+05:30'),
    (1, 2, 450000, '2026-06-15T11:00:00+05:30'),
    (1, 3, 450000, '2026-06-15T11:00:00+05:30'),
    (1, 4, 450000, '2026-06-15T11:00:00+05:30'),

    (2, 1, 1125000, '2026-06-20T15:00:00+05:30'),
    (2, 2, 1125000, '2026-06-20T15:00:00+05:30'),
    (2, 3, 1125000, '2026-06-20T15:00:00+05:30'),
    (2, 4, 1125000, '2026-06-20T15:00:00+05:30'),

    (3, 1, 200000, '2026-06-21T10:00:00+05:30'),
    (3, 2, 200000, '2026-06-21T10:00:00+05:30'),
    (3, 3, 200000, '2026-06-21T10:00:00+05:30'),
    (3, 4, 200000, '2026-06-21T10:00:00+05:30'),

    (4, 1, 53750, '2026-06-22T07:00:00+05:30'),
    (4, 2, 53750, '2026-06-22T07:00:00+05:30'),
    (4, 3, 53750, '2026-06-22T07:00:00+05:30'),
    (4, 4, 53750, '2026-06-22T07:00:00+05:30'),

    (5, 1, 180000, '2026-06-21T21:00:00+05:30'),
    (5, 2, 150000, '2026-06-21T21:00:00+05:30'),
    (5, 3, 140000, '2026-06-21T21:00:00+05:30'),
    (5, 4, 153000, '2026-06-21T21:00:00+05:30');

-- ============================================================
-- Group 2: Flatmates - HSR Layout (Raj, Sanya, Arjun)
-- ============================================================
INSERT INTO expenses (id, group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at) VALUES
    (6,  2, 2, 'Rent - March 2026',         4500000, 'INR', 'EQUAL', 2, '2026-03-01T09:00:00+05:30'),
    (7,  2, 5, 'Electricity bill - BESCOM',  234000, 'INR', 'EQUAL', 5, '2026-06-05T09:00:00+05:30'),
    (8,  2, 6, 'Groceries - BigBasket',      327500, 'INR', 'EQUAL', 6, '2026-07-10T18:00:00+05:30'),
    (9,  2, 2, 'Internet - Airtel Fiber',    149900, 'INR', 'EQUAL', 2, '2026-07-01T09:00:00+05:30'),
    (10, 2, 5, 'Maid salary - February',     450000, 'INR', 'EQUAL', 5, '2026-02-28T09:00:00+05:30');

INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at) VALUES
    (6, 2, 1500000, '2026-03-01T09:00:00+05:30'),
    (6, 5, 1500000, '2026-03-01T09:00:00+05:30'),
    (6, 6, 1500000, '2026-03-01T09:00:00+05:30'),

    (7, 2, 78000, '2026-06-05T09:00:00+05:30'),
    (7, 5, 78000, '2026-06-05T09:00:00+05:30'),
    (7, 6, 78000, '2026-06-05T09:00:00+05:30'),

    -- 327500 / 3 = 109166.67: remainder 2 paise go to the lowest user_ids (2, 5)
    (8, 2, 109167, '2026-07-10T18:00:00+05:30'),
    (8, 5, 109167, '2026-07-10T18:00:00+05:30'),
    (8, 6, 109166, '2026-07-10T18:00:00+05:30'),

    -- 149900 / 3 = 49966.67: remainder 2 paise go to the lowest user_ids (2, 5)
    (9, 2, 49967, '2026-07-01T09:00:00+05:30'),
    (9, 5, 49967, '2026-07-01T09:00:00+05:30'),
    (9, 6, 49966, '2026-07-01T09:00:00+05:30'),

    (10, 2, 150000, '2026-02-28T09:00:00+05:30'),
    (10, 5, 150000, '2026-02-28T09:00:00+05:30'),
    (10, 6, 150000, '2026-02-28T09:00:00+05:30');

-- ============================================================
-- Group 3: Office Lunch Club (Ananya, Arjun, Meera, Karan)
-- ============================================================
INSERT INTO expenses (id, group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at) VALUES
    (11, 3, 3, 'Team lunch - Barbeque Nation', 640000, 'INR', 'EQUAL',      3, '2026-07-15T13:00:00+05:30'),
    (12, 3, 7, 'Birthday cake for Karan',       120000, 'INR', 'EQUAL',      7, '2026-07-22T16:00:00+05:30'),
    (13, 3, 6, 'Coffee run - CCD',                84000, 'INR', 'EQUAL',      6, '2026-07-25T11:00:00+05:30'),
    (14, 3, 8, 'Friday pizza order - Dominos',   215000, 'INR', 'PERCENTAGE', 8, '2026-07-24T20:00:00+05:30');

INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at) VALUES
    (11, 3, 160000, '2026-07-15T13:00:00+05:30'),
    (11, 6, 160000, '2026-07-15T13:00:00+05:30'),
    (11, 7, 160000, '2026-07-15T13:00:00+05:30'),
    (11, 8, 160000, '2026-07-15T13:00:00+05:30'),

    -- birthday cake: split among everyone except the birthday person
    (12, 3, 40000, '2026-07-22T16:00:00+05:30'),
    (12, 6, 40000, '2026-07-22T16:00:00+05:30'),
    (12, 7, 40000, '2026-07-22T16:00:00+05:30'),

    (13, 3, 21000, '2026-07-25T11:00:00+05:30'),
    (13, 6, 21000, '2026-07-25T11:00:00+05:30'),
    (13, 7, 21000, '2026-07-25T11:00:00+05:30'),
    (13, 8, 21000, '2026-07-25T11:00:00+05:30'),

    -- percentage split: Ananya 20%, Arjun 30%, Meera 20%, Karan 30%
    (14, 3, 43000, '2026-07-24T20:00:00+05:30'),
    (14, 6, 64500, '2026-07-24T20:00:00+05:30'),
    (14, 7, 43000, '2026-07-24T20:00:00+05:30'),
    (14, 8, 64500, '2026-07-24T20:00:00+05:30');

-- ============================================================
-- Group 4: Diwali Party Planning (Vikram, Priya, Meera, Karan)
-- ============================================================
INSERT INTO expenses (id, group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at) VALUES
    (15, 4, 4, 'Decorations - Amazon',    360000, 'INR', 'EQUAL',  4, '2026-07-21T14:00:00+05:30'),
    (16, 4, 1, 'Sweets - Haldirams',      285000, 'INR', 'EQUAL',  1, '2026-07-23T15:00:00+05:30'),
    (17, 4, 7, 'Fireworks',               500000, 'INR', 'SHARES', 7, '2026-07-24T17:00:00+05:30'),
    (18, 4, 8, 'Catering - Sagar Ratna',  800000, 'INR', 'EQUAL',  8, '2026-07-25T19:00:00+05:30');

INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at) VALUES
    (15, 4, 90000, '2026-07-21T14:00:00+05:30'),
    (15, 1, 90000, '2026-07-21T14:00:00+05:30'),
    (15, 7, 90000, '2026-07-21T14:00:00+05:30'),
    (15, 8, 90000, '2026-07-21T14:00:00+05:30'),

    (16, 4, 71250, '2026-07-23T15:00:00+05:30'),
    (16, 1, 71250, '2026-07-23T15:00:00+05:30'),
    (16, 7, 71250, '2026-07-23T15:00:00+05:30'),
    (16, 8, 71250, '2026-07-23T15:00:00+05:30'),

    -- shares: Vikram 2, Priya 1, Meera 1, Karan 2 (6 shares, 500000/6 = 83333.33;
    -- remainder 2 paise go to the lowest user_ids, 1 and 4)
    (17, 1, 83334,  '2026-07-24T17:00:00+05:30'),
    (17, 4, 166667, '2026-07-24T17:00:00+05:30'),
    (17, 7, 83333,  '2026-07-24T17:00:00+05:30'),
    (17, 8, 166666, '2026-07-24T17:00:00+05:30'),

    (18, 4, 200000, '2026-07-25T19:00:00+05:30'),
    (18, 1, 200000, '2026-07-25T19:00:00+05:30'),
    (18, 7, 200000, '2026-07-25T19:00:00+05:30'),
    (18, 8, 200000, '2026-07-25T19:00:00+05:30');

-- ============================================================
-- Group 5: Weekend Trek - Nandi Hills (Sanya, Raj, Arjun)
-- ============================================================
INSERT INTO expenses (id, group_id, paid_by, description, total_amount, currency, split_type, created_by, created_at) VALUES
    (19, 5, 5, 'Trek permits',              45000, 'INR', 'EQUAL', 5, '2026-07-19T06:00:00+05:30'),
    (20, 5, 2, 'Fuel - shared cab',         126000, 'INR', 'EQUAL', 2, '2026-07-19T06:30:00+05:30'),
    (21, 5, 6, 'Breakfast - viewpoint cafe', 66000, 'INR', 'EQUAL', 6, '2026-07-19T08:00:00+05:30');

INSERT INTO expense_splits (expense_id, user_id, share_amount, created_at) VALUES
    (19, 5, 15000, '2026-07-19T06:00:00+05:30'),
    (19, 2, 15000, '2026-07-19T06:00:00+05:30'),
    (19, 6, 15000, '2026-07-19T06:00:00+05:30'),

    (20, 5, 42000, '2026-07-19T06:30:00+05:30'),
    (20, 2, 42000, '2026-07-19T06:30:00+05:30'),
    (20, 6, 42000, '2026-07-19T06:30:00+05:30'),

    (21, 5, 22000, '2026-07-19T08:00:00+05:30'),
    (21, 2, 22000, '2026-07-19T08:00:00+05:30'),
    (21, 6, 22000, '2026-07-19T08:00:00+05:30');

-- ============================================================
-- Settlements — a few partial repayments so the settle-up flow has history
-- ============================================================
INSERT INTO settlements (group_id, paid_by, paid_to, amount, idempotency_key, status, created_at) VALUES
    (1, 2, 1, 1500000, gen_random_uuid(), 'COMPLETED', '2026-06-25T10:00:00+05:30'),
    (2, 6, 2,  300000, gen_random_uuid(), 'COMPLETED', '2026-07-12T09:00:00+05:30'),
    (3, 8, 3,   50000, gen_random_uuid(), 'COMPLETED', '2026-07-26T13:00:00+05:30');

-- ============================================================
-- Resync sequences past the explicit ids used above
-- ============================================================
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('groups', 'id'), (SELECT MAX(id) FROM groups));
SELECT setval(pg_get_serial_sequence('expenses', 'id'), (SELECT MAX(id) FROM expenses));
