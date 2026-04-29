import jskDefault from "./jsk-default.js";
import darkRed from "./dark-red.js";

export const templates = [jskDefault, darkRed];

export function getTemplateById(id) {
  return templates.find((t) => t.id === id) || jskDefault;
}