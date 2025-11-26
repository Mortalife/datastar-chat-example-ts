import { html } from "hono/html";
import { ChatMessages, OtherUserInfo, UserInfo } from "./elements";

import type { ChatMessage } from "../social/chat";
import { User } from "../user";
import { json } from "stream/consumers";

export const Render = (props: {
  user: User;
  onlineUsers: User[];
  chatMessages?: ChatMessage[];
}) => {
  return html`
    <div
      class="md:container md:mx-auto grid grid-rows-[50px_1fr_60px] gap-4 h-full items-between"
      id="page"
      data-signals="${JSON.stringify({ user_id: props.user.id })}"
      data-persist:user="user_id"
    >
      <div id="info">${UserInfo()}</div>
      <div
        id="chat"
        class="grid grid-cols-1 grid-rows-[auto_1fr] gap-2 p-4"
        data-signals__ifmissing="${JSON.stringify({ message: "" })}"
      >
        <h2 class="text-2xl font-bold border-b border-gray-700 pb-2">Chat</h2>
        <div class="grid grid-cols-[160px_1fr] justify-stretch gap-2">
          <div class="flex flex-col mr-1 pr-2 gap-2 border-r border-gray-700">
            <h3 class="text-lg font-semibold">Online users:</h3>
            ${props.onlineUsers.map((user) => OtherUserInfo(user))}
          </div>
          <div class="flex flex-col gap-2 justify-end">
            ${ChatMessages(props.chatMessages ?? [], props.user)}
            <form
              class="flex flex-row gap-2"
              data-on:submit="@post('/chat'); $message = ''"
            >
              <input
                type="text"
                class="p-2 border-gray-400 rounded flex-grow"
                autocomplete="off"
                data-bind="message"
                maxlength="100"
                placeholder="Enter your message"
              />
              <button class="btn btn-primary">Send</button>
            </form>
          </div>
        </div>
      </div>
      <div
        class="p-4 flex flex-row gap-2 items-center justify-between"
        data-signals="${JSON.stringify({
          _showUserId: false,
        })}"
      >
        <button class="btn" data-on:click="$_showUserId = !$_showUserId">
          Toggle User Id
        </button>
        <div class="flex flex-row items-center gap-2" data-show="$_showUserId">
          Your user is:
          <input class="input" type="text" value="${props.user.id}" />
        </div>
        <button
          class="btn btn-ghost"
          id="logout"
          data-on:click="@delete('/logout')"
        >
          Logout
        </button>
      </div>
    </div>
  `;
};

export const PageContainer = (props: { user_id: string }) => html`
  <div id="page-container" class="h-full" data-init="@get('/feed')">
    <div
      class="md:container md:mx-auto"
      id="page"
      data-signals="${JSON.stringify({ user_id: props.user_id })}"
      data-persist:user="user_id"
    ></div>
  </div>
`;

export const PageLogin = (props: { user_id: string; error?: string }) => html`
  <div
    class="container mx-auto"
    id="page"
    data-signals="${JSON.stringify({ user_id: props.user_id })}"
    data-persist:user="user_id"
  >
    <div class="grid grid-cols-1 gap-4">
      <h1 class="text-3xl font-bold">Welcome!</h1>
      <form
        class="container grid grid-cols-1 gap-4"
        data-on:submit="@post('/login')"
      >
        <label class="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="h-4 w-4 opacity-70"
          >
            <path
              d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"
            />
          </svg>
          <input
            class="grow"
            type="text"
            autocomplete="off"
            data-bind="user_id"
            placeholder="Enter your existing user id or leave blank to create a new one"
          />
        </label>
        ${props.error &&
        html`<div role="alert" class="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>${props.error}</span>
        </div>`}
        <button class="btn btn-primary" data-on:click_once="@post('/login')">
          Login
        </button>
      </form>
    </div>
  </div>
`;
