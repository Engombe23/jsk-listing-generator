// Central list of PartLister team accounts to exclude from analytics.
// Add new team members here — or extend via the VITE_INTERNAL_USERS env var.
//
// VITE_INTERNAL_USERS=alice@partlister.app,bob@partlister.app
const INTERNAL_EMAILS = [
  "aaron@partlister.app",
  "engombe@partlister.app",
];

const envEmails = (import.meta.env.VITE_INTERNAL_USERS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const INTERNAL_SET = new Set([
  ...INTERNAL_EMAILS.map((e) => e.toLowerCase()),
  ...envEmails,
]);

/**
 * Returns true if the given email belongs to an internal PartLister team member.
 * All analytics providers should gate on this before counting events.
 *
 * @param {string|null|undefined} email
 * @returns {boolean}
 */
export function isInternalUser(email) {
  if (!email) return false;
  return INTERNAL_SET.has(email.toLowerCase());
}
