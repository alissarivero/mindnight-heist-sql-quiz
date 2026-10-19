-- Least-privilege grants. Roles quiz_app and quiz_taker are created (with
-- passwords from the environment) by scripts/setup-db.ts before this runs.

-- quiz_taker: runs student SQL. Read-only on the case data, nothing else.
ALTER ROLE quiz_taker SET default_transaction_read_only = on;
ALTER ROLE quiz_taker SET statement_timeout = '5s';
ALTER ROLE quiz_taker SET search_path = heist;

REVOKE ALL ON SCHEMA heist FROM PUBLIC;
GRANT USAGE ON SCHEMA heist TO quiz_taker;
GRANT SELECT ON ALL TABLES IN SCHEMA heist TO quiz_taker;

REVOKE ALL ON SCHEMA audit FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA audit FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA audit FROM PUBLIC;
REVOKE ALL ON public.submissions FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

DO $$
BEGIN
  -- Supabase API roles must not see quiz internals either.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.submissions FROM anon, authenticated;
    REVOKE ALL ON SEQUENCE public.submissions_id_seq FROM anon, authenticated;
  END IF;
END $$;

-- quiz_app: the server's writer. Can record submissions and append audit
-- events (only through audit.log_event). It cannot UPDATE/DELETE anything.
ALTER ROLE quiz_app SET statement_timeout = '10s';
GRANT USAGE ON SCHEMA public TO quiz_app;
GRANT SELECT, INSERT ON public.submissions TO quiz_app;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO quiz_app;

GRANT USAGE ON SCHEMA audit TO quiz_app;
GRANT SELECT ON audit.log TO quiz_app;
GRANT EXECUTE ON FUNCTION audit.log_event(uuid, text, text, integer, text, integer, boolean) TO quiz_app;
GRANT EXECUTE ON FUNCTION audit.verify_chain() TO quiz_app;
