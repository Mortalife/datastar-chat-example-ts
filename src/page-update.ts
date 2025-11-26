import type { SSEStreamingApi } from "hono/streaming";
import {
  getOnlineStatus,
  getOnlineUsers,
  type UserOnlineStatus,
} from "./social/active";
import {
  calculateMessageHistory,
  getMessages,
  type ChatMessage,
} from "./social/chat";
import { getUser, User } from "./user";
import { Render, PageLogin } from "./templates/page";
import { patchElementEvent } from "./sse";

export const sendPage = async (
  stream: SSEStreamingApi,
  {
    user_id,
    status,
    user,
    chatMessages,
  }: {
    user_id: string;
    status?: UserOnlineStatus;
    user?: User;
    chatMessages?: ChatMessage[];
  }
) => {
  let start = Date.now();
  if (!user) {
    const tempUser = await getUser(user_id);

    if (!tempUser) {
      return PageLogin({ user_id, error: "User not found" });
    }

    user = tempUser;
  }

  if (!chatMessages) {
    if (!status) {
      const tempStatus = await getOnlineStatus(user_id);

      if (!tempStatus) {
        status = {
          online_at: Date.now(),
          user_id: user_id,
        };
      } else {
        status = tempStatus!;
      }
    }
    chatMessages = await getMessages(calculateMessageHistory(status.online_at));
  }

  const onlineUsers = await getOnlineUsers();
  const page = Render({
    user,
    onlineUsers,
    chatMessages,
  });

  if (start % 4 === 0) {
    console.log(`Page state generated in ${Date.now() - start}ms`);
  }

  return stream.writeSSE(patchElementEvent(page));
};

export const sendUserNotFound = async (
  stream: SSEStreamingApi,
  user_id: string
) =>
  stream.writeSSE(
    patchElementEvent(
      PageLogin({
        user_id,
        error: "User not found",
      })
    )
  );
