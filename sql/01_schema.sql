-- The Midnight Heist: case data schema.
-- Times are museum-local wall-clock time (timestamp without time zone).
-- Re-running this file rebuilds the case data from scratch; it does not touch
-- public.submissions or the audit schema.

DROP SCHEMA IF EXISTS heist CASCADE;
CREATE SCHEMA heist;

COMMENT ON SCHEMA heist IS 'Case data for The Midnight Heist SQL quiz (read-only for quiz takers).';

CREATE TABLE heist.suspects (
  id          integer PRIMARY KEY,
  name        text    NOT NULL UNIQUE,
  role        text    NOT NULL,
  motive      text    NOT NULL,
  photo_emoji text    NOT NULL
);

CREATE TABLE heist.rooms (
  id             integer PRIMARY KEY,
  name           text    NOT NULL UNIQUE,
  floor          integer NOT NULL,
  security_level integer NOT NULL CHECK (security_level BETWEEN 1 AND 5)
);

CREATE TABLE heist.artworks (
  id        integer PRIMARY KEY,
  title     text    NOT NULL,
  artist    text    NOT NULL,
  room_id   integer NOT NULL REFERENCES heist.rooms (id),
  value_usd integer NOT NULL,
  status    text    NOT NULL CHECK (status IN ('on display', 'in restoration', 'missing'))
);

CREATE TABLE heist.keycard_swipes (
  id         integer   PRIMARY KEY,
  suspect_id integer   NOT NULL REFERENCES heist.suspects (id),
  room_id    integer   NOT NULL REFERENCES heist.rooms (id),
  swiped_at  timestamp NOT NULL,
  direction  text      NOT NULL CHECK (direction IN ('in', 'out'))
);

CREATE TABLE heist.cctv_sightings (
  id             integer      PRIMARY KEY,
  camera_room_id integer      NOT NULL REFERENCES heist.rooms (id),
  suspect_id     integer      REFERENCES heist.suspects (id), -- NULL = unidentified figure
  seen_at        timestamp    NOT NULL,
  confidence     numeric(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1)
);

CREATE TABLE heist.alibis (
  id               integer   PRIMARY KEY,
  suspect_id       integer   NOT NULL UNIQUE REFERENCES heist.suspects (id),
  claimed_location text      NOT NULL,
  claimed_from     timestamp NOT NULL,
  claimed_to       timestamp NOT NULL
);

CREATE TABLE heist.witness_statements (
  id           integer PRIMARY KEY,
  alibi_id     integer NOT NULL REFERENCES heist.alibis (id),
  witness_name text    NOT NULL,
  corroborates boolean NOT NULL,
  statement    text    NOT NULL
);

CREATE INDEX ON heist.keycard_swipes (suspect_id, swiped_at);
CREATE INDEX ON heist.keycard_swipes (room_id, swiped_at);
CREATE INDEX ON heist.cctv_sightings (camera_room_id, seen_at);

COMMENT ON TABLE heist.keycard_swipes IS 'Every badge swipe at a room door. direction = in/out.';
COMMENT ON TABLE heist.cctv_sightings IS 'Face-match hits from security cameras. suspect_id NULL = unidentified.';
COMMENT ON TABLE heist.witness_statements IS 'Statements about an alibi. corroborates = true means the witness backs it up.';
