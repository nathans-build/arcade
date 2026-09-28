/* What each grade learns in Rock Driller (title screen and README). */
import { courseName, gradeNumber } from "../kit/grades";
import type { Grade } from "../kit/types";
import { kindsForGrade, tagFor } from "./challenges";
import { SITES, GRADE_SITES } from "./geology";

export function gradeTopics(grade: Grade): { summary: string; codes: string[]; sites: string[] } {
  const n = gradeNumber(grade);
  const summaries = [
    "Soil, sand, clay and rock · living or not · hard or soft · top and deepest",
    "Earth materials: soil, sand, clay, pebbles and rock · fossils and crystals",
    "Earth materials: soil, sand, clay, pebbles and rock · fossils and crystals",
    "Soil layers: topsoil, subsoil, weathered rock, bedrock · humus and roots",
    "Rock types: igneous, sedimentary, metamorphic · minerals · fossils · weathering",
    "Rock types · minerals · fossils in sedimentary rock · weathering and soil",
    "The rock cycle · Earth's layers (crust, mantle, core) · ocean and continental crust",
    "Law of superposition (deeper = older) · the rock cycle · Earth's layers",
    "Superposition, cross-cutting dikes and relative dating · rock cycle · Earth's layers",
    "Rock cycle · fossil fuels and oil traps · ores · relative dating",
    "The fossil record: index fossils and geologic eras · oldest life deepest",
    "Radiometric dating with half-lives · resources · the rock cycle",
    "Seismic waves and Earth's liquid outer core · density · half-life dating",
  ];
  const { main, review } = kindsForGrade(grade);
  const codes = [...new Set([...main, ...review].map((k) => tagFor(k, grade).standard))];
  const course = courseName(grade, "science");
  const summary = course ? `${course}: ${summaries[n]}` : summaries[n];
  return { summary, codes, sites: GRADE_SITES[grade].map((s) => SITES[s].name) };
}
