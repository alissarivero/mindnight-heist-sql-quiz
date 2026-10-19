import type { PoolConfig } from "pg";

/**
 * Connection config for the Supabase session pooler with libpq-style
 * `sslmode=require` (TLS mandatory, certificate not pinned). node-postgres
 * would otherwise treat `require` in the URL as verify-full and override `ssl`.
 */
export function pgConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  url.searchParams.delete("uselibpqcompat");
  return {
    connectionString: url.toString(),
    ssl: sslmode === "disable" ? false : { rejectUnauthorized: false },
  };
}
