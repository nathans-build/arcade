/* Shared constants and tiny helpers for the UI. */
export const GAME_ID = "page-quest";

/** True while the player is typing in a form field (so A–D and friends never trigger answers). */
export function isTyping(ev: Event): boolean {
  const t = ev.target as HTMLElement | null;
  if (!t || !t.tagName) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}
