import { z } from "zod";
import { client } from "./database";
import { PubSub, USER_EVENT } from "./sse/pubsub";

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const getUserSync = async (id: string) => {
  if (!id) {
    id = crypto.randomUUID();
    await client.execute({
      sql: "INSERT INTO users (id) VALUES (?)",
      args: [id],
    });
  }

  return getUser(id);
};

export const getUser = async (id: string) => {
  const result = await client.execute({
    sql: "SELECT id, username FROM users WHERE id = ?",
    args: [id],
  });

  if (!result.rows.length) {
    return null;
  }

  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const parsedUser = UserSchema.safeParse({
    id: user["id"],
    username: user["username"],
  });

  if (!parsedUser.success) {
    return null;
  }

  return parsedUser.data;
};

export const updateUsername = async (id: string, username: string) => {
  await client.execute({
    sql: "UPDATE users SET username = ? WHERE id = ?",
    args: [username, id],
  });

  PubSub.publish(USER_EVENT, { user_id: id });
};
