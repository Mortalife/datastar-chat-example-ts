import { type HtmlEscapedString } from "hono/utils/html";

export const fragmentEvent = (
  html: HtmlEscapedString | Promise<HtmlEscapedString>,
  id: number
) => {
  return {
    data: `fragments ${html.toString().replaceAll("\n", "")}\n\n`,
    event: "datastar-merge-fragments",
    id: `${id}`,
  };
};
