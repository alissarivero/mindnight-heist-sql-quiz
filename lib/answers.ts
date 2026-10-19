/**
 * Answer key. Imported by API routes and tests only, never by client
 * components, so hints stay behind authentication.
 * Expected rows are in normalized form (see lib/grading.ts) and are verified
 * against the seed data by tests/unit/answers.test.ts and tests/live.
 */
export type AnswerKey = {
  hintSql: string;
  columns: string[];
  rows: string[][];
};

export const ANSWERS: Record<number, AnswerKey> = {
  1: {
    hintSql: `SELECT DISTINCT s.name
FROM suspects s
JOIN keycard_swipes k ON k.suspect_id = s.id
WHERE k.direction = 'in'
  AND k.swiped_at BETWEEN '2026-03-13 22:00' AND '2026-03-14 02:00'
ORDER BY s.name;`,
    columns: ["name"],
    rows: [
      ["Darius Okafor"],
      ["Elena Voss"],
      ["Margot Chen"],
      ["Nadia Bloom"],
      ["Oliver Grant"],
      ["Priya Nair"],
      ["Tomas Rivera"],
      ["Victor Langley"],
    ],
  },
  2: {
    hintSql: `SELECT r.name, COUNT(*) AS swipes
FROM keycard_swipes k
JOIN rooms r ON r.id = k.room_id
WHERE k.swiped_at >= '2026-03-14 00:00'
  AND k.swiped_at <  '2026-03-14 02:00'
GROUP BY r.name
HAVING COUNT(*) > 3
ORDER BY swipes DESC, r.name;`,
    columns: ["name", "swipes"],
    rows: [
      ["Loading Dock", "7"],
      ["Gallery B", "6"],
      ["Staff Lounge", "4"],
      ["Vault Corridor", "4"],
    ],
  },
  3: {
    hintSql: `SELECT s.name, a.claimed_location
FROM suspects s
JOIN alibis a ON a.suspect_id = s.id
WHERE NOT EXISTS (
  SELECT 1
  FROM witness_statements w
  WHERE w.alibi_id = a.id
    AND w.corroborates
)
ORDER BY s.name;`,
    columns: ["name", "claimed_location"],
    rows: [
      ["Darius Okafor", "Restoration Lab, working late"],
      ["Elena Voss", "Hotel Marlowe bar"],
      ["Oliver Grant", "On a delivery route across town"],
      ["Priya Nair", "Security Office, patching servers"],
    ],
  },
  4: {
    hintSql: `SELECT s.name, c.seen_at, c.confidence
FROM cctv_sightings c
JOIN suspects s ON s.id = c.suspect_id
JOIN rooms r    ON r.id = c.camera_room_id
WHERE r.name = 'Gallery B'
  AND c.seen_at BETWEEN TIMESTAMP '2026-03-14 00:47' - INTERVAL '10 minutes'
                    AND TIMESTAMP '2026-03-14 00:47' + INTERVAL '10 minutes'
ORDER BY c.seen_at;`,
    columns: ["name", "seen_at", "confidence"],
    rows: [
      ["Darius Okafor", "2026-03-14 00:41:00", "0.88"],
      ["Priya Nair", "2026-03-14 00:52:00", "0.61"],
    ],
  },
  5: {
    hintSql: `WITH vault AS (
  SELECT k.suspect_id,
         k.direction,
         k.swiped_at,
         LEAD(k.swiped_at) OVER (
           PARTITION BY k.suspect_id ORDER BY k.swiped_at
         ) AS next_swipe
  FROM keycard_swipes k
  JOIN rooms r ON r.id = k.room_id
  WHERE r.name = 'Vault Corridor'
)
SELECT s.name,
       SUM(EXTRACT(EPOCH FROM (v.next_swipe - v.swiped_at)) / 60)::int AS minutes_in_vault
FROM vault v
JOIN suspects s ON s.id = v.suspect_id
WHERE v.direction = 'in'
GROUP BY s.name
ORDER BY minutes_in_vault DESC
LIMIT 1;`,
    columns: ["name", "minutes_in_vault"],
    rows: [["Darius Okafor", "21"]],
  },
};
