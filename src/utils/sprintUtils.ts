import type { SprintRange } from "../types";
import { addDays } from "./dateUtils";

export function getSprintRange(sprintStart: Date, sprintDays: number, sprintNr: number): SprintRange {
  const start = addDays(sprintStart, (sprintNr - 1) * sprintDays);
  const end = addDays(start, sprintDays - 1);
  return { nr: sprintNr, start, end };
}

export function sprintNrForDate(d: Date, sprintStart: Date, sprintDays: number): number | null {
  if (d < sprintStart) return null;
  return Math.floor((d.getTime() - sprintStart.getTime()) / (24 * 3600 * 1000) / sprintDays) + 1;
}

export function buildSprints(
  projectStart: Date,
  projectEnd: Date,
  sprintStart: Date,
  sprintWeeks: number
): SprintRange[] {
  const sprintDays = sprintWeeks * 7;
  const s: SprintRange[] = [];
  const base = new Date(sprintStart);
  base.setHours(0, 0, 0, 0);

  const startNr = Math.max(1, sprintNrForDate(projectStart, base, sprintDays) ?? 1);
  const endNr = Math.max(startNr, sprintNrForDate(projectEnd, base, sprintDays) ?? startNr);

  for (let nr = startNr; nr <= endNr; nr++) {
    s.push(getSprintRange(base, sprintDays, nr));
  }

  return s;
}
