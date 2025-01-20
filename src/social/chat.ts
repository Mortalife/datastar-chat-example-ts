import { client } from "../database";

export type ChatMessage = {
  id: number;
  user_id: string;
  message: string;
  sent_at: number;
};

export const saveMessage = async (user_id: string, message: string) => {
  await client.execute({
    sql: "INSERT INTO messages (id, user_id, message, sent_at) VALUES (null, ?, ?, ?)",
    args: [user_id, message, Date.now()],
  });
};
export const getMessages = async (since: number) => {
  const result = await client.execute({
    sql: "SELECT * FROM messages WHERE sent_at > ? ORDER BY sent_at DESC",
    args: [since],
  });

  return result.rows as unknown as ChatMessage[];
};

export const calculateMessageHistory = (online_at: number) =>
  online_at - 60 * 60 * 1000;

export const restrictUserId = (user_id: string) => {
  return user_id.slice(0, 8);
};
