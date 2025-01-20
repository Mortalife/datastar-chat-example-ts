export const toHtmlJson = (data: Object) => {
  let json = "";
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (typeof value === "object") {
      json += `${key}: ${toHtmlJson(value)},`;
      continue;
    }
    if (typeof value === "boolean") {
      json += `${key}: ${value},`;
      continue;
    }

    json += `${key}: '${value}',`;
  }
  return `{${json}}`;
};
