import { bankFor } from "../kit/banks";
import { FocusCatalog } from "./focus";

/** Which topics each grade offers, built from the kit's written banks (Vite's import.meta.glob). */
export const catalog = new FocusCatalog(bankFor);
