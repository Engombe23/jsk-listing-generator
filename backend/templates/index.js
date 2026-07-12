import cleanDefault from "./clean-default.js";
import darkHeader from "./dark-header.js";
import tableFocused from "./table-focused.js";
import minimal from "./minimal.js";
import professionalBlue from "./professional-blue.js";

// Legacy aliases kept so existing records that stored "jsk-default" or "dark-red" still resolve
import jskDefault from "./jsk-default.js";
import darkRed from "./dark-red.js";

export const templates = [
  cleanDefault,
  darkHeader,
  tableFocused,
  minimal,
  professionalBlue,
  // legacy
  jskDefault,
  darkRed
];

export function getTemplateById(id) {
  return templates.find((t) => t.id === id) || cleanDefault;
}

// Expose the list of theme choices for the API
export const THEME_LIST = [
  { id: cleanDefault.id,       name: cleanDefault.name },
  { id: darkHeader.id,         name: darkHeader.name },
  { id: tableFocused.id,       name: tableFocused.name },
  { id: minimal.id,            name: minimal.name },
  { id: professionalBlue.id,   name: professionalBlue.name }
];
