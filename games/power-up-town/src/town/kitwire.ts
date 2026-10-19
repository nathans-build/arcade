import { bankFor } from "../kit/banks";
import type { KitScience } from "./questions";

/** The kit's written science bank (loaded with Vite's import.meta.glob). */
export const kitScience: KitScience = (g) => bankFor("science", g);
