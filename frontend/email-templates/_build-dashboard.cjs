/**
 * Builds Dashboard-ready Go templates that branch on {{ .Data.i18n }}.
 * Output: frontend/email-templates/dashboard/{signup-confirmation,password-reset}.html
 *          + subjects.txt for Dashboard subject lines (also Go-templated).
 *
 * Requires per-lang HTML from _generate.cjs first.
 *
 * Logo: https://partlister.app/logo.png (Gmail blocks data:image URIs in mail).
 * Keep public/logo.png small + Cache-Control so the fetch is fast.
 */
const fs = require("fs");
const path = require("path");

const LANGS = ["fr", "de", "it", "es", "ar", "tr", "en"]; // en last as {{ else }}
const root = __dirname;
const outDir = path.join(root, "dashboard");
const MAX_BODY_CHARS = 50000;

// Supabase subject field max is 255 chars for the *entire* Go template source.
// Seven full language branches exceed that (boilerplate alone ≈ 200). Keep
// subjects short and only branch languages that fit; others use English.
// Bodies stay fully localized in the HTML templates.
const SUBJECT_LANGS = ["fr", "de", "ar"]; // + en as {{ else }}
const SUBJECTS = {
  signup: {
    en: "Confirm your PartLister account",
    fr: "Confirmez votre compte PartLister",
    de: "PartLister-Konto bestätigen",
    ar: "تأكيد حساب PartLister",
  },
  reset: {
    en: "Reset your PartLister password",
    fr: "Réinitialisez votre mot de passe",
    de: "PartLister-Passwort zurücksetzen",
    ar: "إعادة تعيين كلمة مرور PartLister",
  },
};

function toGoBody(html) {
  // Dashboard uses Go template ConfirmationURL, not our Edge Function token
  return html
    .split("{{CONFIRMATION_URL}}").join("{{ .ConfirmationURL }}")
    .trim();
}

function wrapLangBranches(fileName) {
  const chunks = [];
  for (const lang of LANGS) {
    const html = toGoBody(
      fs.readFileSync(path.join(root, lang, fileName), "utf8"),
    );
    if (lang === "en") {
      chunks.push(`{{ else }}\n${html}\n{{ end }}`);
    } else if (lang === "fr") {
      chunks.push(`{{ if eq .Data.i18n "${lang}" }}\n${html}`);
    } else {
      chunks.push(`{{ else if eq .Data.i18n "${lang}" }}\n${html}`);
    }
  }
  return chunks.join("\n\n");
}

function buildBody(fileName) {
  // Keep readable multi-line HTML for Dashboard paste / review.
  const out = wrapLangBranches(fileName) + "\n";
  if (out.length > MAX_BODY_CHARS) {
    throw new Error(
      `${fileName} is ${out.length} chars (max ${MAX_BODY_CHARS}).`,
    );
  }
  if (!out.includes("https://partlister.app/logo.png")) {
    throw new Error(
      `${fileName} is missing https://partlister.app/logo.png — run _generate.cjs first.`,
    );
  }
  if (out.includes("data:image")) {
    throw new Error(
      `${fileName} still has data:image URIs — Gmail will not show those.`,
    );
  }
  return out;
}

function wrapSubjectBranches(map) {
  // Compact Go syntax (no spaces) to stay under the 255-char Dashboard limit.
  const langs = [...SUBJECT_LANGS, "en"];
  const parts = [];
  for (const lang of langs) {
    const s = map[lang];
    if (lang === "en") {
      parts.push(`{{else}}${s}{{end}}`);
    } else if (lang === langs[0]) {
      parts.push(`{{if eq .Data.i18n "${lang}"}}${s}`);
    } else {
      parts.push(`{{else if eq .Data.i18n "${lang}"}}${s}`);
    }
  }
  const out = parts.join("");
  if (out.length > 255) {
    throw new Error(
      `Subject template is ${out.length} chars (max 255). Shorten SUBJECTS or SUBJECT_LANGS.`,
    );
  }
  return out;
}

// LEFT-TO-RIGHT MARK: keeps the Supabase Dashboard textarea LTR even though
// Arabic copy is present later in the same Go-template source.
const LTR_LOCK = "\u200E";

fs.mkdirSync(outDir, { recursive: true });
const signupBody = LTR_LOCK + buildBody("signup-confirmation.html");
const resetBody = LTR_LOCK + buildBody("password-reset.html");
fs.writeFileSync(path.join(outDir, "signup-confirmation.html"), signupBody, "utf8");
fs.writeFileSync(path.join(outDir, "password-reset.html"), resetBody, "utf8");
const signupSubject = wrapSubjectBranches(SUBJECTS.signup);
const resetSubject = wrapSubjectBranches(SUBJECTS.reset);

fs.writeFileSync(
  path.join(outDir, "subjects.txt"),
  [
    "# Paste into Supabase Dashboard → Authentication → Email Templates",
    "# Subject field max 255 chars (entire Go template). it/es/tr subjects fall back to English;",
    "# HTML bodies remain fully localized for all languages.",
    "",
    `## Confirm signup — Subject (${signupSubject.length}/255)`,
    signupSubject,
    "",
    `## Reset password — Subject (${resetSubject.length}/255)`,
    resetSubject,
    "",
  ].join("\n"),
  "utf8",
);

console.log("Wrote dashboard Go templates to", outDir);
console.log("signup body:", signupBody.length, "/", MAX_BODY_CHARS);
console.log("reset body:", resetBody.length, "/", MAX_BODY_CHARS);
console.log("signup subject:", signupSubject.length, "/255");
console.log("reset subject:", resetSubject.length, "/255");
