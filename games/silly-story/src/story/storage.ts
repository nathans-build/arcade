/*
 * On-device saves (localStorage only; nothing is uploaded). Keys start with "arcade.silly-story."
 * so the arcade's player switcher files them away per player.
 */
import { cleanText } from "./safety";

export const CUSTOM_KEY = "arcade.silly-story.custom.v1";
export const SHELF_KEY = "arcade.silly-story.shelf.v1";
export const STATS_KEY = "arcade.silly-story.stats.v1";

export const MAX_CUSTOM = 20;
export const MAX_SHELF = 40;
export const MAX_TEMPLATE = 1500;
export const MAX_TITLE = 40;

export interface CustomStory {
  id: string;
  title: string;
  bg: string;
  template: string;
  updated: number;
}

export interface ShelfItem {
  id: string;
  title: string;
  /** Built-in story id, or "custom". */
  storyId: string;
  bg: string;
  template: string;
  words: string[];
  grade: string;
  saved: number;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const newId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export function loadCustom(): CustomStory[] {
  return read<CustomStory>(CUSTOM_KEY).filter((s) => s && typeof s.template === "string" && typeof s.title === "string");
}

/** Saves (or updates) a kid's story; text is cleaned of rude words first. */
export function saveCustom(story: CustomStory): CustomStory[] {
  const clean: CustomStory = {
    ...story,
    title: cleanText(story.title).slice(0, MAX_TITLE).trim() || "My Silly Story",
    template: cleanText(story.template).slice(0, MAX_TEMPLATE),
    updated: Date.now(),
  };
  const list = loadCustom().filter((s) => s.id !== story.id);
  list.unshift(clean);
  const out = list.slice(0, MAX_CUSTOM);
  write(CUSTOM_KEY, out);
  return out;
}

export function deleteCustom(id: string): CustomStory[] {
  const out = loadCustom().filter((s) => s.id !== id);
  write(CUSTOM_KEY, out);
  return out;
}

export function loadShelf(): ShelfItem[] {
  return read<ShelfItem>(SHELF_KEY).filter((s) => s && Array.isArray(s.words) && typeof s.template === "string");
}

export function addToShelf(item: ShelfItem): { list: ShelfItem[]; ok: boolean } {
  const list = loadShelf().filter((s) => s.id !== item.id);
  list.unshift(item);
  const out = list.slice(0, MAX_SHELF);
  return { list: out, ok: write(SHELF_KEY, out) };
}

export function removeFromShelf(id: string): ShelfItem[] {
  const out = loadShelf().filter((s) => s.id !== id);
  write(SHELF_KEY, out);
  return out;
}

export function storiesMade(): number {
  try {
    return Number(localStorage.getItem(STATS_KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

export function countStory(): number {
  const n = storiesMade() + 1;
  try {
    localStorage.setItem(STATS_KEY, String(n));
  } catch {
    // ignore
  }
  return n;
}
