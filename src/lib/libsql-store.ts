import type { Store, SessionData } from "hono-sessions";
import { createClient, type Client } from "@libsql/client";

class LibsqlStore implements Store {
  constructor(private client: Client) {}

  async getSessionById(sessionId: string): Promise<SessionData | null> {
    const session = await this.client.execute({
      sql: "SELECT * FROM sessions WHERE id = ?",
      args: [sessionId],
    });
    return session && session.rows.length
      ? JSON.parse(session.rows[0]!["data"] as string)
      : null;
  }

  async createSession(sessionId: string, initialData: SessionData) {
    const data = JSON.stringify(initialData);
    await this.client.execute({
      sql: "INSERT INTO sessions (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = ?",
      args: [sessionId, data, sessionId, data],
    });
  }

  async persistSessionData(sessionId: string, sessionData: SessionData) {
    const data = JSON.stringify(sessionData);
    await this.client.execute({
      sql: "INSERT INTO sessions (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = ?",
      args: [sessionId, data, data],
    });
  }

  async deleteSession(sessionId: string) {
    await this.client.execute({
      sql: "DELETE FROM sessions WHERE id = ?",
      args: [sessionId],
    });
  }
}

export const client = createClient({
  url: `file:${process.env["DATABASE_PATH"] ?? ""}local.sessions.db`,
});

await client.execute("PRAGMA journal_mode = WAL;");
await client.execute("PRAGMA busy_timeout = 5000;");
await client.execute("PRAGMA synchronous = NORMAL;");
await client.execute("PRAGMA cache_size = 2000;");
await client.execute("PRAGMA foreign_keys = ON;");

await client.migrate([
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT)",
]);

export const sessionStore = new LibsqlStore(client);
