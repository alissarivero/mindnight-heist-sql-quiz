export type Question = {
  id: number;
  code: string;
  title: string;
  points: number;
  skills: string[];
  /** Prompt text. `inline code` is rendered as code. */
  prompt: string[];
  starterSql: string;
  /** Story beat revealed on the evidence board once the clue is solved. */
  solvedNote: string;
};

export const THEFT_TIME = "2026-03-14 00:47";

export const QUESTIONS: Question[] = [
  {
    id: 1,
    code: "EXHIBIT A",
    title: "Who Was Inside?",
    points: 4,
    skills: ["JOIN", "WHERE range", "DISTINCT", "ORDER BY"],
    prompt: [
      "The museum closed to the public at 18:00. Our first job is to find out who came back after dark.",
      "List the `name` of every suspect who swiped **in** (`direction = 'in'`) at any door between `2026-03-13 22:00` and `2026-03-14 02:00`, inclusive.",
      "Each name should appear once. Sort alphabetically.",
    ],
    starterSql: "-- Tables: suspects, keycard_swipes, rooms ...\nSELECT *\nFROM keycard_swipes\nLIMIT 10;",
    solvedNote: "Eight people were inside that night. Felix Hartmann left at 21:55 and Sasha Ivanova went home at five, so both are cleared.",
  },
  {
    id: 2,
    code: "EXHIBIT B",
    title: "The Busy Doors",
    points: 4,
    skills: ["GROUP BY", "COUNT", "HAVING"],
    prompt: [
      "Something was moving through the building after midnight. Find the hot spots.",
      "For swipes from `2026-03-14 00:00` up to (but not including) `2026-03-14 02:00`, count the swipes (both in and out) per room.",
      "Return the room `name` and the swipe count, only for rooms with **more than 3** swipes, busiest first.",
    ],
    starterSql: "SELECT r.name, k.swiped_at, k.direction\nFROM keycard_swipes k\nJOIN rooms r ON r.id = k.room_id\nORDER BY k.swiped_at;",
    solvedNote: "The Loading Dock and Gallery B were busiest, and the Vault Corridor (security level 5) saw four swipes. Someone took the painting out through the basement.",
  },
  {
    id: 3,
    code: "EXHIBIT C",
    title: "Shaky Alibis",
    points: 4,
    skills: ["LEFT JOIN anti-join", "NOT EXISTS", "boolean filters"],
    prompt: [
      "Everyone has a story. Find the ones nobody will vouch for.",
      "List each suspect whose alibi has **no** witness statement with `corroborates = true`. Watch out: some alibis do have a statement, but the witness contradicts them.",
      "Return the suspect `name` and their `claimed_location`.",
    ],
    starterSql: "SELECT a.*, w.witness_name, w.corroborates\nFROM alibis a\nLEFT JOIN witness_statements w ON w.alibi_id = a.id;",
    solvedNote: "Four alibis don't hold up: Darius Okafor, Elena Voss, Oliver Grant, and Priya Nair. The bartender says the bar closed at midnight, and nobody saw Darius in the lab.",
  },
  {
    id: 4,
    code: "EXHIBIT D",
    title: "Caught on Camera",
    points: 4,
    skills: ["interval arithmetic", "INNER vs LEFT JOIN", "time windows"],
    prompt: [
      "The Azure Heron left its frame at `00:47`. The Gallery B camera caught faces around that moment.",
      "Find every **identified** suspect seen by the camera in **Gallery B** within 10 minutes either side of `2026-03-14 00:47` (inclusive).",
      "Return the suspect `name`, `seen_at`, and `confidence`, earliest first.",
    ],
    starterSql: "SELECT *\nFROM cctv_sightings\nWHERE camera_room_id = 3\nORDER BY seen_at;",
    solvedNote: "Two faces were near the frame at the moment of the theft: Darius Okafor (00:41) and Priya Nair (00:52). Both have shaky alibis. The vault corridor will settle it.",
  },
  {
    id: 5,
    code: "EXHIBIT E",
    title: "The Accusation",
    points: 4,
    skills: ["CTE", "window functions (LEAD)", "EXTRACT(EPOCH)"],
    prompt: [
      "The painting had to pass through the **Vault Corridor** to reach the loading dock. Whoever lingered there longest is our thief.",
      "Pair each `'in'` swipe at the Vault Corridor with the **next** swipe by the same suspect at that room (use `LEAD`), and add up the minutes each suspect spent inside.",
      "Return only the top suspect: their `name` and total minutes as an **integer**.",
    ],
    starterSql: "SELECT s.name, k.direction, k.swiped_at\nFROM keycard_swipes k\nJOIN suspects s ON s.id = k.suspect_id\nJOIN rooms r ON r.id = k.room_id\nWHERE r.name = 'Vault Corridor'\nORDER BY s.name, k.swiped_at;",
    solvedNote: "Darius Okafor spent 21 minutes in the Vault Corridor, ten times longer than anyone else. Case closed.",
  },
];

export const TOTAL_POINTS = QUESTIONS.reduce((sum, q) => sum + q.points, 0);

export function getQuestion(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
