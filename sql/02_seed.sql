-- The Midnight Heist: seed data.
-- The "Azure Heron" vanished from Gallery B at 00:47 on 14 March 2026.

INSERT INTO heist.suspects (id, name, role, motive, photo_emoji) VALUES
  (1,  'Victor Langley', 'Chief Curator',            'Passed over for museum director',       '🎩'),
  (2,  'Margot Chen',    'Night Security Guard',     'Mounting gambling debts',               '🔦'),
  (3,  'Darius Okafor',  'Restoration Specialist',   'Insists the Heron on display is a fake', '🖌️'),
  (4,  'Elena Voss',     'Visiting Art Dealer',      'Has a private buyer waiting in Geneva', '💼'),
  (5,  'Tomas Rivera',   'Night Janitor',            'Received a termination notice',         '🧹'),
  (6,  'Priya Nair',     'IT Security Admin',        'Once "accidentally" disabled cameras',  '💻'),
  (7,  'Felix Hartmann', 'Board Member',             'Heavily insured the painting last month','🏛️'),
  (8,  'Sasha Ivanova',  'Tour Guide',               'None known',                            '🗺️'),
  (9,  'Oliver Grant',   'Courier',                  'Owes Elena Voss a large sum',           '📦'),
  (10, 'Nadia Bloom',    'Curatorial Intern',        'Struggling to pay art-school tuition',  '📚');

INSERT INTO heist.rooms (id, name, floor, security_level) VALUES
  (1, 'Main Lobby',       1, 1),
  (2, 'Gallery A',        1, 2),
  (3, 'Gallery B',        2, 3),
  (4, 'Vault Corridor',   0, 5),
  (5, 'Security Office',  1, 4),
  (6, 'Loading Dock',     0, 2),
  (7, 'Staff Lounge',     1, 1),
  (8, 'Restoration Lab',  2, 3);

INSERT INTO heist.artworks (id, title, artist, room_id, value_usd, status) VALUES
  (1, 'The Azure Heron',        'Ines Moreau',     3, 18500000, 'missing'),
  (2, 'Harbor at Dusk',         'Ansel Whitford',  2,  2400000, 'on display'),
  (3, 'Study of a Red Fox',     'Mira Kowalski',   2,   950000, 'on display'),
  (4, 'The Quiet Orchard',      'Ines Moreau',     3,  6100000, 'on display'),
  (5, 'Lantern Bearers',        'Kenji Arakawa',   8,  3300000, 'in restoration'),
  (6, 'Portrait of a Stranger', 'Unknown',         3,  1200000, 'on display'),
  (7, 'Salt Flats No. 4',       'Dana Okoye',      1,   480000, 'on display');

INSERT INTO heist.keycard_swipes (id, suspect_id, room_id, swiped_at, direction) VALUES
  -- daytime / before the night window
  (1,  8, 1, '2026-03-13 09:02', 'in'),
  (2,  8, 1, '2026-03-13 17:05', 'out'),
  (3,  1, 1, '2026-03-13 08:45', 'in'),
  (4,  1, 1, '2026-03-13 18:10', 'out'),
  (5,  7, 1, '2026-03-13 21:30', 'in'),
  (6,  7, 1, '2026-03-13 21:55', 'out'),
  -- Victor Langley
  (7,  1, 1, '2026-03-13 22:05', 'in'),
  (8,  1, 2, '2026-03-13 22:20', 'in'),
  (9,  1, 3, '2026-03-13 22:28', 'in'),
  (10, 1, 3, '2026-03-13 22:40', 'out'),
  (11, 1, 1, '2026-03-13 23:15', 'out'),
  -- Margot Chen
  (12, 2, 5, '2026-03-13 22:00', 'in'),
  (13, 2, 4, '2026-03-13 23:30', 'in'),
  (14, 2, 4, '2026-03-13 23:35', 'out'),
  (15, 2, 3, '2026-03-13 23:48', 'in'),
  (16, 2, 3, '2026-03-13 23:55', 'out'),
  (17, 2, 5, '2026-03-14 00:15', 'in'),
  (18, 2, 1, '2026-03-14 01:30', 'in'),
  -- Darius Okafor
  (19, 3, 6, '2026-03-13 22:50', 'in'),
  (20, 3, 8, '2026-03-13 23:10', 'in'),
  (21, 3, 8, '2026-03-14 00:35', 'out'),
  (22, 3, 3, '2026-03-14 00:39', 'in'),
  (23, 3, 3, '2026-03-14 00:43', 'out'),
  (24, 3, 4, '2026-03-14 00:44', 'in'),
  (25, 3, 4, '2026-03-14 01:05', 'out'),
  (26, 3, 6, '2026-03-14 01:12', 'out'),
  -- Elena Voss
  (27, 4, 1, '2026-03-13 23:40', 'in'),
  (28, 4, 2, '2026-03-14 00:20', 'in'),
  (29, 4, 2, '2026-03-14 00:30', 'out'),
  (30, 4, 7, '2026-03-14 00:32', 'in'),
  (31, 4, 3, '2026-03-14 01:08', 'in'),
  (32, 4, 3, '2026-03-14 01:15', 'out'),
  (33, 4, 1, '2026-03-14 01:25', 'out'),
  -- Tomas Rivera
  (34, 5, 7, '2026-03-13 22:15', 'in'),
  (35, 5, 6, '2026-03-14 00:05', 'in'),
  (36, 5, 6, '2026-03-14 00:25', 'out'),
  (37, 5, 7, '2026-03-14 00:30', 'in'),
  (38, 5, 7, '2026-03-14 01:50', 'out'),
  -- Priya Nair
  (39, 6, 5, '2026-03-13 23:55', 'in'),
  (40, 6, 5, '2026-03-14 00:48', 'out'),
  (41, 6, 3, '2026-03-14 00:50', 'in'),
  (42, 6, 3, '2026-03-14 00:55', 'out'),
  (43, 6, 4, '2026-03-14 00:58', 'in'),
  (44, 6, 4, '2026-03-14 01:00', 'out'),
  (45, 6, 5, '2026-03-14 01:02', 'in'),
  -- Oliver Grant
  (46, 9, 6, '2026-03-14 00:10', 'in'),
  (47, 9, 6, '2026-03-14 00:20', 'out'),
  (48, 9, 6, '2026-03-14 01:40', 'in'),
  (49, 9, 6, '2026-03-14 01:55', 'out'),
  -- Nadia Bloom
  (50, 10, 8, '2026-03-13 22:30', 'in'),
  (51, 10, 8, '2026-03-13 23:20', 'out'),
  (52, 10, 7, '2026-03-13 23:25', 'in'),
  (53, 10, 7, '2026-03-14 00:40', 'out');

INSERT INTO heist.cctv_sightings (id, camera_room_id, suspect_id, seen_at, confidence) VALUES
  (1,  1, 7,    '2026-03-13 21:31', 0.98),
  (2,  3, 1,    '2026-03-13 22:31', 0.95),
  (3,  4, 2,    '2026-03-13 23:31', 0.85),
  (4,  1, 4,    '2026-03-13 23:41', 0.99),
  (5,  3, 2,    '2026-03-13 23:50', 0.90),
  (6,  6, 9,    '2026-03-14 00:12', 0.97),
  (7,  3, 3,    '2026-03-14 00:41', 0.88),
  (8,  4, 3,    '2026-03-14 00:45', 0.40),
  (9,  3, NULL, '2026-03-14 00:47', 0.15),
  (10, 3, 6,    '2026-03-14 00:52', 0.61),
  (11, 3, 4,    '2026-03-14 01:10', 0.93),
  (12, 6, 3,    '2026-03-14 01:13', 0.72),
  (13, 6, 9,    '2026-03-14 01:42', 0.95);

INSERT INTO heist.alibis (id, suspect_id, claimed_location, claimed_from, claimed_to) VALUES
  (1,  1,  'Home, on a video call with his sister',  '2026-03-13 23:30', '2026-03-14 02:00'),
  (2,  2,  'Security Office, monitoring feeds',      '2026-03-14 00:00', '2026-03-14 01:30'),
  (3,  3,  'Restoration Lab, working late',          '2026-03-13 23:00', '2026-03-14 01:30'),
  (4,  4,  'Hotel Marlowe bar',                      '2026-03-14 00:00', '2026-03-14 02:00'),
  (5,  5,  'Staff Lounge, on break',                 '2026-03-14 00:30', '2026-03-14 01:00'),
  (6,  6,  'Security Office, patching servers',      '2026-03-13 23:55', '2026-03-14 01:30'),
  (7,  7,  'Hartmann Foundation charity gala',       '2026-03-13 22:00', '2026-03-14 01:00'),
  (8,  8,  'Home, asleep',                           '2026-03-13 22:00', '2026-03-14 07:00'),
  (9,  9,  'On a delivery route across town',        '2026-03-14 00:30', '2026-03-14 01:30'),
  (10, 10, 'Staff Lounge, studying',                 '2026-03-13 23:25', '2026-03-14 00:40');

INSERT INTO heist.witness_statements (id, alibi_id, witness_name, corroborates, statement) VALUES
  (1,  1,  'Ruth Langley',   true,  'We were on a call the whole time, I have the call log.'),
  (2,  2,  'Tomas Rivera',   true,  'I saw Margot at the monitors when I walked past.'),
  (3,  3,  'Nadia Bloom',    false, 'Darius left the lab well before 1am. His lamp was off.'),
  (4,  4,  'Hotel bartender',false, 'Never saw her. The bar closed at midnight.'),
  (5,  5,  'Nadia Bloom',    true,  'Tomas was in the lounge eating noodles.'),
  (6,  7,  'Gala host',      true,  'Felix gave a toast at 23:00 and stayed until close.'),
  (7,  7,  'Valet attendant',true,  'Brought his car around at 01:05.'),
  (8,  8,  'Roommate',       true,  'She was asleep by ten.'),
  (9,  10, 'Tomas Rivera',   true,  'Nadia had her textbooks all over the lounge table.');
