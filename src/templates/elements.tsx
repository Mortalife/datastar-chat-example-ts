import { html } from "hono/html";
import { restrictUserId, type ChatMessage } from "../social/chat";
import { formatDistance } from "date-fns";
import { User } from "../user";

export const ChatMessages = (messages: ChatMessage[], user: User) => {
  const now = new Date();
  return html` <div
    id="chat-messages"
    class="max-h-[450px] flex flex-col-reverse overflow-auto"
  >
    ${messages.map((message) => {
      const isYou = message.user_id === user.id;

      return html`<div
        id="message-${message.id}"
        class="chat ${isYou ? "chat-end" : "chat-start"}"
      >
        <div class="dramatic-ease chat-bubble">
          <div class="chat-header text-xs">
            ${isYou ? "You" : restrictUserId(message.user_id)}
          </div>
          <div>${message.message}</div>
          <div class="chat-footer opacity-50">
            <time class="text-xs opacity-50"
              >${formatDistance(new Date(message.sent_at), now, {
                addSuffix: true,
              })}</time
            >
          </div>
        </div>
      </div>`;
    })}
  </div>`;
};

export const UserInfo = () => html` <div
  id="user-info"
  class="w-full flex flex-row justify-end items-center"
>
  <div class="flex flex-row gap-2">
    <button class="btn btn-square" data-on-click="@get('/refresh')">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    </button>
  </div>
</div>`;
export const OtherUserInfo = (otherUser: User) => html` <div
  id="other-user-${otherUser.id}"
  class="w-full flex flex-row justify-between"
>
  <p>${restrictUserId(otherUser.id)}</p>
</div>`;
