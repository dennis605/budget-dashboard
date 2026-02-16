import { useMemo } from "react";
import type { CalendarCell, DailyRow, ParsedDates, SprintRange } from "../types";
import { statusFor, statusLabelFor, statusReasonFor } from "../utils/budgetUtils";
import { addDays, monthKey, parseISODate, startOfMonth, toISODate } from "../utils/dateUtils";
import { getSprintRange } from "../utils/sprintUtils";

interface UseCalendarArgs {
  monthShown: string;
  dailyRows: DailyRow[];
  parsed: ParsedDates;
  monthlyCap: number;
  totalBudget: number;
  sprintCapDefault: number;
  sprintDays: number;
  sprints: SprintRange[];
  sprintAvg: Map<number, number>;
}

interface UseCalendarResult {
  month: Date;
  cells: CalendarCell[];
  monthPlanned: number;
}

export function useCalendar({
  monthShown,
  dailyRows,
  parsed,
  monthlyCap,
  totalBudget,
  sprintCapDefault,
  sprintDays,
  sprints,
  sprintAvg,
}: UseCalendarArgs): UseCalendarResult {
  return useMemo<UseCalendarResult>(() => {
    const m = parseISODate(monthShown);
    const first = startOfMonth(m);
    const weekdayMon0 = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -weekdayMon0);

    const cells: CalendarCell[] = [];
    const byISO = new Map<string, DailyRow>(dailyRows.map((r) => [toISODate(r.date), r]));
    const sprintStartSet = new Set<string>(sprints.map((s) => toISODate(s.start)));

    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
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

      cells.push({
        d,
        planned,
        rM,
        rS,
        rT,
        monthCap: monthlyCap,
        status,
        inProject,
        inMonth: d.getMonth() === m.getMonth(),
        sprintNr,
        capThisSprint,
        sprintStart,
        statusReason: reason,
        statusLabel: statusLabelFor(reason),
        sprintDay,
        sprintTotalDays,
        avg: sprintNr !== null ? sprintAvg.get(sprintNr) : undefined,
      });
    }

    const mk = monthKey(m);
    const monthPlanned = dailyRows.filter((r) => r.mk === mk).reduce((a, b) => a + b.planned, 0);

    return { month: m, cells, monthPlanned };
  }, [dailyRows, monthShown, monthlyCap, parsed.end, parsed.sprintStart, parsed.start, sprintAvg, sprintCapDefault, sprintDays, sprints, totalBudget]);
}
