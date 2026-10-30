/*
 * Gate anchors → NC ELA standard codes for the player's grade (the kit's code forms):
 * grade 4 → RL.4.3, grade 7 → RL.7.3, grade 9/10 → RL.9-10.3, grade 11/12 → RL.11-12.3.
 *
 * RF (foundational skills) standards stop after grade 5, so from grade 6 up RF.3 (word
 * analysis) is reported as L.x.4 (word meaning from roots and clues) and RF.4 (fluency)
 * as RL.x.10 (reading range and fluency). See README "Codes to verify".
 */
import { ANCHORS } from "./roster";

export function gradePart(grade: number): string {
  if (grade >= 11) return "11-12";
  if (grade >= 9) return "9-10";
  return String(grade);
}

export function standardFor(anchor: string, grade: number): { code: string; skill: string } {
  const [strand, num] = anchor.split(".");
  if (strand === "RF" && grade >= 6) {
    if (num === "3") return { code: `L.${gradePart(grade)}.4`, skill: ANCHORS["L.4"] };
    return { code: `RL.${gradePart(grade)}.10`, skill: "Reading range & fluency" };
  }
  return { code: `${strand}.${gradePart(grade)}.${num}`, skill: ANCHORS[anchor] ?? anchor };
}
