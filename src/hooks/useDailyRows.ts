import { useMemo } from "react";
import type { BarData, BurnData, DailyRow, ParsedDates, SprintCap, Task } from "../types";
import { calcDailyPlan } from "../utils/budgetUtils";
import { clamp, isWeekend, monthKey, parseISODate, toISODate } from "../utils/dateUtils";
import { addDays } from "../utils/dateUtils";
import { sprintNrForDate } from "../utils/sprintUtils";

interface UseDailyRowsArgs {
  projectStart: string;
  projectEnd: string;
  sprintStart: string;
  sprintWeeks: number;
  tasks: Task[];
  monthlyCap: number;
  totalBudget: number;
  sprintCapDefault: number;
  sprintCaps: SprintCap[];
}

interface SprintStats {
  avg: Map<number, number>;
}

interface UseDailyRowsResult {
  parsed: ParsedDates;
  sprintDays: number;
  sprint1StartLabel: string;
  sprintAtProjectStart: number | null;
  dayHours: Map<string, number>;
  sprints: { nr: number; start: Date; end: Date }[];
  dailyRows: DailyRow[];
  burn: BurnData;
  sprintStats: SprintStats;
  barData: BarData;
}

export function useDailyRows({
  projectStart,
  projectEnd,
  sprintStart,
  sprintWeeks,
  tasks,
  monthlyCap,
  totalBudget,
  sprintCapDefault,
  sprintCaps,
}: UseDailyRowsArgs): UseDailyRowsResult {
  const parsed = useMemo<ParsedDates>(() => {
    const ps = parseISODate(projectStart);
    const pe = parseISODate(projectEnd);
    const ss = parseISODate(sprintStart);
    return ps <= pe ? { start: ps, end: pe, sprintStart: ss } : { start: pe, end: ps, sprintStart: ss };
  }, [projectStart, projectEnd, sprintStart]);

  const normalizedSprintWeeks = clamp(Number(sprintWeeks) || 1, 1, 12);
  const sprintDays = normalizedSprintWeeks * 7;

  const { dayHours, sprints } = useMemo(() => {
    return calcDailyPlan({
      projectStart: parsed.start,
      projectEnd: parsed.end,
      sprintStart: parsed.sprintStart,
      sprintWeeks: normalizedSprintWeeks,
      tasks: tasks.map((t) => ({
        ...t,
        sprintNr: Number(t.sprintNr),
        hours: Number(t.hours),
      })),
    });
  }, [normalizedSprintWeeks, parsed.end, parsed.sprintStart, parsed.start, tasks]);

  const sprint1Start = parsed.sprintStart;
  const sprint1StartLabel = sprint1Start.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const sprintAtProjectStart = sprintNrForDate(parsed.start, parsed.sprintStart, sprintDays);

  const { dailyRows, burn } = useMemo<{ dailyRows: DailyRow[]; burn: BurnData }>(() => {
    const rows: DailyRow[] = [];

    let cur = new Date(parsed.start);
    cur.setHours(0, 0, 0, 0);

    const end = new Date(parsed.end);
    end.setHours(0, 0, 0, 0);

    const capMap = new Map<number, number>(sprintCaps.map((s) => [Number(s.nr), Number(s.cap)]));

    let cumTotal = 0;
    const byMonth = new Map<string, number>();
    const bySprint = new Map<number, number>();

    let breakDate: Date | null = null;

    while (cur <= end) {
      const key = toISODate(cur);
      const planned = dayHours.get(key) ?? 0;

      cumTotal += planned;

      const mk = monthKey(cur);
      byMonth.set(mk, (byMonth.get(mk) ?? 0) + planned);

      const sn = sprintNrForDate(cur, parsed.sprintStart, sprintDays);
      if (sn !== null) bySprint.set(sn, (bySprint.get(sn) ?? 0) + planned);

      const usedMonth = byMonth.get(mk) ?? 0;
      const usedSprint = sn !== null ? bySprint.get(sn) ?? 0 : 0;

      const capThis = sn !== null ? (capMap.get(sn) ?? sprintCapDefault) : null;
      const rMonth = monthlyCap - usedMonth;
      const rSprint = sn !== null ? (capThis ?? sprintCapDefault) - usedSprint : Number.POSITIVE_INFINITY;
      const rTotal = totalBudget - cumTotal;

      if (!breakDate && (rMonth < 0 || rSprint < 0 || rTotal < 0)) {
        breakDate = new Date(cur);
      }

      rows.push({
        date: new Date(cur),
        planned,
        mk,
        sprintNr: sn,
        capThisSprint: capThis,
        remainingMonth: rMonth,
        remainingSprint: rSprint,
        remainingTotal: rTotal,
      });

      cur = addDays(cur, 1);
    }

    return {
      dailyRows: rows,
      burn: { totalPlanned: cumTotal, dateBudgetBreak: breakDate },
    };
  }, [dayHours, monthlyCap, parsed.end, parsed.sprintStart, parsed.start, sprintCaps, sprintCapDefault, sprintDays, totalBudget]);

  const sprintStats = useMemo<SprintStats>(() => {
    const totals = new Map<number, number>();
    const workdays = new Map<number, number>();

    for (const r of dailyRows) {
      if (r.sprintNr === null) continue;
      totals.set(r.sprintNr, (totals.get(r.sprintNr) ?? 0) + r.planned);
      if (!isWeekend(r.date)) {
        workdays.set(r.sprintNr, (workdays.get(r.sprintNr) ?? 0) + 1);
      }
    }

    const avg = new Map<number, number>();
    for (const [nr, total] of totals) {
      const wd = workdays.get(nr) ?? 1;
      avg.set(nr, total / wd);
    }

    return { avg };
  }, [dailyRows]);

  const barData = useMemo<BarData>(() => {
    const totalPlanned = dailyRows.reduce((sum, r) => sum + r.planned, 0);

    const monthMap = new Map<string, number>();
    for (const r of dailyRows) {
      monthMap.set(r.mk, (monthMap.get(r.mk) ?? 0) + r.planned);
    }

    const months = Array.from(monthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([mk, planned]) => ({
        key: mk,
        label: parseISODate(`${mk}-01`).toLocaleDateString("de-DE", { month: "long", year: "numeric" }),
        planned,
        cap: monthlyCap,
      }));

    const capMap = new Map<number, number>(sprintCaps.map((s) => [Number(s.nr), Number(s.cap)]));
    const sprintMap = new Map<number, { planned: number }>();

    for (const r of dailyRows) {
      if (r.sprintNr === null) continue;
      const current = sprintMap.get(r.sprintNr) ?? { planned: 0 };
      current.planned += r.planned;
      sprintMap.set(r.sprintNr, current);
    }

    const sprintsBars = Array.from(sprintMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([nr, v]) => ({
        nr,
        planned: v.planned,
        cap: capMap.get(nr) ?? sprintCapDefault,
      }));

    return {
      total: { planned: totalPlanned, cap: totalBudget },
      months,
      sprints: sprintsBars,
    };
  }, [dailyRows, monthlyCap, sprintCaps, sprintCapDefault, totalBudget]);

  return {
    parsed,
    sprintDays,
    sprint1StartLabel,
    sprintAtProjectStart,
    dayHours,
    sprints,
    dailyRows,
    burn,
    sprintStats,
    barData,
  };
}
