import { html, raw } from "hono/html";
import { PageContainer } from "./page";

let css = "";

if (process.env.NODE_ENV === "production") {
  const manifest = (
    await import(
      path.join(process.cwd(), "./dist/static/.vite/manifest.json"),
      {
        with: {
          type: "json",
        },
      }
    )
  ).default;

  css = manifest["src/client.ts"].css[0];
}

import path from "node:path";

interface SiteData {
  title: string;
  description: string;
  image: string;
  children?: any;
}
const Layout = async (props: SiteData) => {
  return html`
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${props.title}</title>
    <meta name="description" content="${props.description}">
    <head prefix="og: http://ogp.me/ns#">
    <meta property="og:type" content="article">
    <!-- More elements slow down JSX, but not template literals. -->
    <meta property="og:title" content="${props.title}">
    <meta property="og:image" content="${props.image}">
    
    <script type="module" src="https://cdn.jsdelivr.net/npm/@starfederation/datastar@1.0.0-beta.1/dist/datastar.js"></script>
    ${
      process.env.NODE_ENV === "production"
        ? raw(`<script type="module" src="/static/assets/client.js"></script>
          <link rel="stylesheet" href="/static/${css}">`)
        : raw(
            '<script type="module" src="http://localhost:5173/src/client.ts"></script>'
          )
    }

  </head>
  <body class="p-4">
    ${props.children}
  </body>
  </html>
  `;
};

const Content = async (props: { siteData: SiteData; user_id: string }) => {
  return Layout({
    ...props.siteData,
    children: PageContainer({ user_id: props.user_id }),
  });
};

export { Layout, Content };
