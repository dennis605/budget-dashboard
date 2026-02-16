import type { CalcDailyPlanInput, DayHoursResult, Status, StatusInput, StatusReason } from "../types";
import { toISODate, workdaysBetweenInclusive } from "./dateUtils";
import { buildSprints, getSprintRange } from "./sprintUtils";

export function calcDailyPlan({
  projectStart,
  projectEnd,
  sprintStart,
  sprintWeeks,
  tasks,
}: CalcDailyPlanInput): DayHoursResult {
  const sprintDays = sprintWeeks * 7;
  const sprintBase = new Date(sprintStart);
  sprintBase.setHours(0, 0, 0, 0);
  const sprints = buildSprints(projectStart, projectEnd, sprintBase, sprintWeeks);
  const dayHours = new Map<string, number>();

  for (const t of tasks) {
    if (!t.name || !Number.isFinite(t.hours) || t.hours <= 0) continue;
    const sprintNr = Number(t.sprintNr);
    if (!Number.isFinite(sprintNr) || sprintNr < 1) continue;
    const s = getSprintRange(sprintBase, sprintDays, sprintNr);

    const overlapStart = s.start < projectStart ? projectStart : s.start;
    const overlapEnd = s.end > projectEnd ? projectEnd : s.end;
    if (overlapStart > overlapEnd) continue;

    const wd = workdaysBetweenInclusive(overlapStart, overlapEnd);
    if (!wd.length) continue;

    const per = t.hours / wd.length;
    for (const d of wd) {
      if (d < projectStart || d > projectEnd) continue;
      const k = toISODate(d);
      dayHours.set(k, (dayHours.get(k) ?? 0) + per);
    }
  }

  return { dayHours, sprints };
}

export function statusFor({ remainingMonth, remainingTotal, remainingSprint }: StatusInput): Status {
  return remainingMonth < 0 || remainingTotal < 0 || remainingSprint < 0 ? "bad" : "ok";
}

export function statusReasonFor({
  remainingMonth,
  remainingTotal,
  remainingSprint,
  hasSprint,
}: StatusInput & { hasSprint: boolean }): StatusReason {
  if (remainingMonth < 0) return "month";
  if (remainingTotal < 0) return "total";
  if (hasSprint && remainingSprint < 0) return "sprint";
  return "ok";
}

export function statusLabelFor(reason: StatusReason): string {
  if (reason === "sprint") return "Achtung: Sprint-Cap";
  if (reason === "month") return "Achtung: Monats-Cap";
  if (reason === "total") return "Achtung: Gesamtbudget";
  return "OK";
}

export function sprintTintClass(nr: number | null): string {
  if (!nr) return "";
  const palette = ["bg-blue-50", "bg-indigo-50", "bg-violet-50", "bg-cyan-50", "bg-emerald-50", "bg-amber-50"];
  return palette[(nr - 1) % palette.length];
}
