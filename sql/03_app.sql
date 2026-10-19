-- Quiz submissions + tamper-evident audit log.
-- Safe to re-run: existing submissions and audit rows are preserved.

CREATE TABLE IF NOT EXISTS public.submissions (
  id          bigserial   PRIMARY KEY,
  user_id     uuid        NOT NULL,
  user_email  text        NOT NULL,
  question_id integer     NOT NULL,
  sql_text    text        NOT NULL,
  is_correct  boolean     NOT NULL,
  row_count   integer     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submissions_user_q ON public.submissions (user_id, question_id, created_at DESC);
-- Not exposed through Supabase's REST API: RLS on with no policies.
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.log (
  id          bigserial   PRIMARY KEY,
  user_id     uuid,
  user_email  text        NOT NULL,
  action      text        NOT NULL CHECK (action IN ('run', 'save', 'hint', 'explain')),
  question_id integer,
  sql_text    text,
  row_count   integer,
  is_correct  boolean,
  created_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
  prev_hash   text        NOT NULL,
  row_hash    text        NOT NULL
);

-- Each row's hash covers its own contents plus the previous row's hash, so
-- editing or deleting any row breaks every hash after it.
CREATE OR REPLACE FUNCTION audit.compute_hash(
  p_prev text, p_user_id uuid, p_email text, p_action text, p_question integer,
  p_sql text, p_rows integer, p_correct boolean, p_at timestamptz
) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(sha256(convert_to(concat_ws(E'\x1f',
    p_prev,
    coalesce(p_user_id::text, ''),
    p_email,
    p_action,
    coalesce(p_question::text, ''),
    coalesce(p_sql, ''),
    coalesce(p_rows::text, ''),
    coalesce(p_correct::text, ''),
    to_char(p_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')
  ), 'UTF8')), 'hex')
$$;

CREATE OR REPLACE FUNCTION audit.log_event(
  p_user_id uuid, p_email text, p_action text, p_question integer,
  p_sql text, p_rows integer, p_correct boolean
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = audit, pg_temp AS $$
DECLARE
  v_prev text;
  v_at   timestamptz := clock_timestamp();
  v_id   bigint;
BEGIN
  -- serialize writers so two events can never share a prev_hash
  LOCK TABLE audit.log IN SHARE ROW EXCLUSIVE MODE;
  SELECT row_hash INTO v_prev FROM audit.log ORDER BY id DESC LIMIT 1;
  v_prev := coalesce(v_prev, 'GENESIS');

  INSERT INTO audit.log (user_id, user_email, action, question_id, sql_text, row_count, is_correct, created_at, prev_hash, row_hash)
  VALUES (p_user_id, p_email, p_action, p_question, p_sql, p_rows, p_correct, v_at, v_prev,
          audit.compute_hash(v_prev, p_user_id, p_email, p_action, p_question, p_sql, p_rows, p_correct, v_at))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION audit.verify_chain()
RETURNS TABLE (ok boolean, total_rows bigint, first_bad_id bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = audit, pg_temp AS $$
DECLARE
  r      record;
  v_prev text := 'GENESIS';
  v_n    bigint := 0;
BEGIN
  FOR r IN SELECT * FROM audit.log ORDER BY id LOOP
    v_n := v_n + 1;
    IF r.prev_hash <> v_prev OR r.row_hash <> audit.compute_hash(
         r.prev_hash, r.user_id, r.user_email, r.action, r.question_id,
         r.sql_text, r.row_count, r.is_correct, r.created_at) THEN
      RETURN QUERY SELECT false, v_n, r.id;
      RETURN;
    END IF;
    v_prev := r.row_hash;
  END LOOP;
  RETURN QUERY SELECT true, v_n, NULL::bigint;
END;
$$;

CREATE OR REPLACE FUNCTION audit.reject_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit.log is append-only (% blocked)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit.log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit.log
  FOR EACH ROW EXECUTE FUNCTION audit.reject_change();

DROP TRIGGER IF EXISTS audit_log_no_truncate ON audit.log;
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit.log
  FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_change();
