/*
 * Every quest, in the order the "Choose your quest" screen shows them. Quest 1 is the original
 * Lost Library (its save key never changes, so current players keep their progress).
 */
import type { QuestDef } from "../quest";
import { LIBRARY } from "../world";
import { CLOCKWORK } from "./clockwork";
import { LIGHTHOUSE } from "./lighthouse";
import { MUSEUM } from "./museum";
import { VOLCANO } from "./volcano";

export const QUESTS: QuestDef[] = [LIBRARY, LIGHTHOUSE, CLOCKWORK, VOLCANO, MUSEUM];

export function questById(id: string | null | undefined): QuestDef | null {
  return QUESTS.find((q) => q.id === id) ?? null;
}

/** The quest picked last time (localStorage), so Enter on the title continues it. */
export const LAST_QUEST_KEY = "arcade.lost-library.quest";
export function loadLastQuest(): QuestDef {
  try {
    return questById(localStorage.getItem(LAST_QUEST_KEY)) ?? QUESTS[0];
  } catch {
    return QUESTS[0];
  }
}
export function saveLastQuest(q: QuestDef): void {
  try {
    localStorage.setItem(LAST_QUEST_KEY, q.id);
  } catch {
    // ignore
  }
}
