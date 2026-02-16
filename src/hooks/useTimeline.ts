import { useMemo } from "react";
import type { CalendarCell, DailyRow, ParsedDates, TimelineWeek } from "../types";
import { statusFor, statusLabelFor, statusReasonFor } from "../utils/budgetUtils";
import { addDays, toISODate } from "../utils/dateUtils";
import { getSprintRange } from "../utils/sprintUtils";

interface UseTimelineArgs {
  dailyRows: DailyRow[];
  parsed: ParsedDates;
  monthlyCap: number;
  totalBudget: number;
  sprintCapDefault: number;
  sprintDays: number;
  sprints: { nr: number; start: Date; end: Date }[];
  sprintAvg: Map<number, number>;
}

interface UseTimelineResult {
  weeks: TimelineWeek[];
}

export function useTimeline({
  dailyRows,
  parsed,
  monthlyCap,
  totalBudget,
  sprintCapDefault,
  sprintDays,
  sprints,
  sprintAvg,
}: UseTimelineArgs): UseTimelineResult {
  return useMemo<UseTimelineResult>(() => {
    const byISO = new Map<string, DailyRow>(dailyRows.map((r) => [toISODate(r.date), r]));
    const sprintStartSet = new Set<string>(sprints.map((s) => toISODate(s.start)));

    const start = new Date(parsed.start);
    start.setHours(0, 0, 0, 0);
    const startMonOffset = (start.getDay() + 6) % 7;
    const gridStart = addDays(start, -startMonOffset);

    const end = new Date(parsed.end);
    end.setHours(0, 0, 0, 0);
    const endSunOffset = 6 - ((end.getDay() + 6) % 7);
    const gridEnd = addDays(end, endSunOffset);

    const weeks: TimelineWeek[] = [];
    let cur = new Date(gridStart);

    while (cur <= gridEnd) {
      const week: CalendarCell[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(cur);
        const iso = toISODate(d);
        const r = byISO.get(iso);

        const inProject = d >= parsed.start && d <= parsed.end;
        const planned = r?.planned ?? 0;
        const rM = r?.remainingMonth ?? monthlyCap;
        const rS = r?.remainingSprint ?? sprintCapDefault;
        const rT = r?.remainingTotal ?? totalBudget;
        const sprintNr = r?.sprintNr ?? null;
        const capThisSprint = r?.capThisSprint ?? null;
        const sprintStart = inProject ? sprintStartSet.has(iso) : false;
        const reason = inProject
          ? statusReasonFor({
              remainingMonth: rM,
              remainingTotal: rT,
              remainingSprint: rS,
              hasSprint: sprintNr !== null,
            })
          : "ok";
        const status = inProject
          ? statusFor({ remainingMonth: rM, remainingTotal: rT, remainingSprint: rS })
          : "ok";
        const sprintRange = sprintNr ? getSprintRange(parsed.sprintStart, sprintDays, sprintNr) : null;
        const sprintDay = sprintRange ? Math.floor((d.getTime() - sprintRange.start.getTime()) / (24 * 3600 * 1000)) + 1 : null;
        const sprintTotalDays = sprintRange ? sprintDays : null;

        week.push({
          d,
          planned,
          rM,
          rS,
          rT,
          monthCap: monthlyCap,
          status,
          inProject,
          sprintNr,
          capThisSprint,
          sprintStart,
          statusReason: reason,
          statusLabel: statusLabelFor(reason),
          sprintDay,
          sprintTotalDays,
          avg: sprintNr !== null ? sprintAvg.get(sprintNr) : undefined,
        });

        cur = addDays(cur, 1);
      }

      const monthStartCell = week.find((c) => c.d.getDate() === 1);
      const monthLabel = monthStartCell
        ? monthStartCell.d.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
        : null;

      weeks.push({ week, monthLabel });
    }

    return { weeks };
  }, [dailyRows, monthlyCap, parsed.end, parsed.sprintStart, parsed.start, sprintAvg, sprintCapDefault, sprintDays, sprints, totalBudget]);
}
