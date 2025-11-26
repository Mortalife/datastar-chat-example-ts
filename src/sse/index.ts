import { type HtmlEscapedString } from "hono/utils/html";

export const patchElementEvent = (
  html: HtmlEscapedString | Promise<HtmlEscapedString>
) => {
  return {
    data: [`elements ${html.toString().replaceAll("\n", "\nelements ")}`].join(
      "\n"
    ),
    event: "datastar-patch-elements",
  };
};
