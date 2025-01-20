/**
 *   "CREATE TABLE IF NOT EXISTS online (id INTEGER PRIMARY KEY, user_id TEXT, online_at INT)",
 */

import { client } from "../database";
import { User, UserSchema } from "../user";

export type UserOnlineStatus = {
  user_id: string;
  online_at: number;
};

export const markUserOnline = async (user_id: string) => {
  await client.execute({
    sql: "INSERT INTO online (user_id, online_at) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET online_at = ?",
    args: [user_id, Date.now(), Date.now()],
  });
};
export const markUserOffline = async (user_id: string) => {
  await client.execute({
    sql: "DELETE FROM online WHERE user_id = ?",
    args: [user_id],
  });
};

export const getOnlineUsers = async () => {
  const result = await client.execute(
    "SELECT users.* FROM online JOIN users ON online.user_id = users.id"
  );

  return result.rows
    .map((row) =>
      UserSchema.safeParse({
        id: row["id"],
        username: row["username"],
      })
    )
    .map((row) => row.data)
    .filter(Boolean) as User[];
};

export const getOnlineStatus = async (user_id: string) => {
  const result = await client.execute({
    sql: "SELECT * FROM online WHERE user_id = ?",
    args: [user_id],
  });

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0] as unknown as UserOnlineStatus;
};
