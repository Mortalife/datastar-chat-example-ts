import { createClient } from "@libsql/client";

export const client = createClient({
  url: `file:${process.env["DATABASE_PATH"] ?? ""}local.db`,
});

await client.execute("PRAGMA journey_mode = WAL;");
await client.execute("PRAGMA busy_timeout = 5000;");
await client.execute("PRAGMA synchronous = NORMAL;");
await client.execute("PRAGMA cache_size = 2000;");
await client.execute("PRAGMA foreign_keys = ON;");

await client.migrate([
  "CREATE TABLE IF NOT EXISTS users (id TEXT, username TEXT, PRIMARY KEY (id))",
  "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, user_id TEXT, message TEXT, sent_at INT)",
  "CREATE TABLE IF NOT EXISTS online (user_id TEXT PRIMARY KEY, online_at INT)",
]);

if (process.env.NODE_ENV !== "production") {
  console.log((await client.execute("SELECT * FROM users")).toJSON());
} else {
  console.log(
    (await client.execute("SELECT count(*) as c FROM users")).rows[0]!["c"]
  );
}
