import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { Session, sessionMiddleware } from "hono-sessions";
import { Content } from "./templates/layout";
import { getUser, getUserSync } from "./user";
import { CHAT_EVENT, PubSub, USER_EVENT } from "./sse/pubsub";
import { saveMessage } from "./social/chat";
import { markUserOffline, markUserOnline } from "./social/active";
import { sendPage, sendUserNotFound } from "./page-update";

import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";

import { sessionStore } from "./lib/libsql-store";
import pDebounce from "p-debounce";
import { compression } from "./lib/compression";

type SessionDataTypes = {
  user_id: string;
};

const app = new Hono<{
  Variables: {
    session: Session<SessionDataTypes>;
    session_key_rotation: boolean;
  };
}>({});

app.use("*", (c, next) => {
  // Don't give a session to the healthcheck
  if (c.req.path === "/health") {
    return next();
  }

  const session = sessionMiddleware({
    store: sessionStore,
    encryptionKey:
      process.env["SESSION_SECRET"] ?? "secret-key-that-should-be-very-secret",
    expireAfterSeconds: 60 * 60 * 24 * 90, // Expire session after 90 days of inactivity
    cookieOptions: {
      sameSite: "Lax", // Recommended for basic CSRF protection in modern browsers
      path: "/", // Required for this library to work properly
      httpOnly: true, // Recommended to avoid XSS attacks
    },
    sessionCookieName: "chat-session",
  });

  return session(c, next);
});

app.use(compression);

app.use(
  "/static/assets/*",
  serveStatic({
    root: "./dist/static/assets",
    rewriteRequestPath: (path) => path.replace("/static/assets", ""),
  })
);

app.get("/", async (c) => {
  return c.html(
    await Content({
      siteData: {
        title: "Chat Example",
        description: "Chat Example of DataStar",
        image: "",
      },
      user_id: "",
    })
  );
});

app.post("/login", async (c) => {
  const { user_id = "" } = await c.req.json<{ user_id: string }>();
  const user = await getUserSync(user_id);

  console.log(user);

  if (user) {
    const session = c.get("session");
    session.set("user_id", user.id);
  }

  return streamSSE(
    c,
    async (stream) => {
      if (!user) {
        return sendUserNotFound(stream, user_id);
      }

      await sendPage(stream, {
        user_id: user.id,
      });
    },
    async (err) => {
      console.error(err);
    }
  );
});

app.delete("/logout", async (c) => {
  const session = c.get("session");
  const user_id = session.get("user_id") ?? "";
  const user = await getUserSync(user_id);

  if (user) {
    session.deleteSession();
  }

  return streamSSE(
    c,
    async (stream) => {
      return await sendUserNotFound(stream, "");
    },
    async (err) => {
      console.error(err);
    }
  );
});

app.get("/feed", async (c) => {
  const session = c.get("session");
  const user_id = session.get("user_id") ?? "";

  return streamSSE(
    c,
    async (stream) => {
      const onlineAt = Date.now();
      const user = await getUser(user_id);

      if (!user) {
        return await sendUserNotFound(stream, user_id);
      }

      await markUserOnline(user.id);

      await sendPage(stream, {
        user_id: user.id,
        user,
        status: {
          online_at: onlineAt,
          user_id: user.id,
        },
      });

      const updateFeed = pDebounce(async () => {
        await sendPage(stream, {
          user_id: user.id,
          status: {
            online_at: onlineAt,
            user_id: user.id,
          },
        });
      }, 300);

      const processChatEvent = async () => {
        updateFeed();
      };

      PubSub.subscribe(CHAT_EVENT, processChatEvent);

      const processUserEvent = async () => {
        updateFeed();
      };

      PubSub.subscribe(USER_EVENT, processUserEvent);

      let isAborted = false;

      stream.onAbort(async () => {
        PubSub.off(CHAT_EVENT, processChatEvent);
        PubSub.off(USER_EVENT, processUserEvent);
        await markUserOffline(user.id);

        console.log("user offline");
        isAborted = true;
      });

      while (!isAborted) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    },
    async (err) => {
      console.error(err);
      if (user_id) {
        await markUserOffline(user_id);
      }
    }
  );
});

app.get("/refresh", async (c) => {
  const session = c.get("session");
  const user_id = session.get("user_id") ?? "";
  return streamSSE(
    c,
    async (stream) => {
      const user = await getUser(user_id);

      if (!user) {
        return await sendUserNotFound(stream, user_id);
      }

      await sendPage(stream, {
        user_id: user.id,
        user,
      });
    },
    async (err, stream) => {
      console.error(err);
    }
  );
});

app.post("/chat", async (c) => {
  const { message } = await c.req.json();
  const session = c.get("session");
  const user_id = session.get("user_id") ?? "";

  return streamSSE(c, async () => {
    const user = await getUser(user_id);

    console.log(user_id, message);

    if (!user) {
      return;
    }

    await saveMessage(user_id, message);
    PubSub.publish(CHAT_EVENT, {
      user_id,
      message,
    });
  });
});

app.get("/health", (c) => {
  return c.text("OK");
});

console.log(`Server is running on http://localhost:3000`);

serve({
  fetch: app.fetch,
  port: 3000,
});
