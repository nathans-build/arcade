import type { Grade, Question, Subject } from "../types";

/*
 * Written question banks, one file per subject and grade:
 *   banks/science/gK.ts, g1.ts … g12.ts
 *   banks/ela/gK.ts, g1.ts … g12.ts
 *   banks/social/gK.ts, g1.ts … g12.ts   (social studies)
 * Each file has `export default [ …Question ]`. Files are picked up automatically,
 * so adding a grade is just adding a file. (Math is generated, see math.ts.)
 */
const scienceFiles = import.meta.glob<{ default: Question[] }>("./science/g*.ts", { eager: true });
const elaFiles = import.meta.glob<{ default: Question[] }>("./ela/g*.ts", { eager: true });
const socialFiles = import.meta.glob<{ default: Question[] }>("./social/g*.ts", { eager: true });

function byGrade(files: Record<string, { default: Question[] }>): Partial<Record<Grade, Question[]>> {
  const out: Partial<Record<Grade, Question[]>> = {};
  for (const [path, mod] of Object.entries(files)) {
    const m = path.match(/g(K|\d+)\.ts$/);
    if (m) out[m[1] as Grade] = mod.default;
  }
  return out;
}

const BANKS: Record<Exclude<Subject, "math">, Partial<Record<Grade, Question[]>>> = {
  science: byGrade(scienceFiles),
  ela: byGrade(elaFiles),
  social: byGrade(socialFiles),
};

/** Written questions for a subject and grade (empty if none exist yet). */
export function bankFor(subject: Exclude<Subject, "math">, grade: Grade): Question[] {
  return BANKS[subject][grade] ?? [];
}
