import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import type { CardInfo, SprintCap, Status, Task, ViewMode } from "./types";
import TaskTable from "./components/TaskTable";
import ParameterPanel from "./components/ParameterPanel";
import CalendarPanel from "./components/CalendarPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import { useDailyRows } from "./hooks/useDailyRows";
import { useCalendar } from "./hooks/useCalendar";
import { useTimeline } from "./hooks/useTimeline";
import { clamp, fmtDE, parseISODate, toISODate, workdaysBetweenInclusive } from "./utils/dateUtils";
import { sprintTintClass, statusFor } from "./utils/budgetUtils";
import { buildSprints, sprintNrForDate } from "./utils/sprintUtils";

const LS_TASKS = "budget-dashboard.tasks";
const LS_RANGE = "budget-dashboard.range";
const LS_BUDGET = "budget-dashboard.budget";

const DEFAULT_TASKS: Task[] = [
  { id: "t1", name: "Task A", sprintNr: 1, hours: 80 },
  { id: "t2", name: "Task B", sprintNr: 2, hours: 80 },
  { id: "t3", name: "Task C", sprintNr: 3, hours: 80 },
];

const DEFAULT_SPRINT_CAPS: SprintCap[] = [
  { nr: 1, cap: 80 },
  { nr: 2, cap: 80 },
  { nr: 3, cap: 80 },
  { nr: 4, cap: 80 },
];

function readLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function BudgetSprintDashboardInner(): JSX.Element {
  const persistedBudget = readLocalStorage<{
    totalBudget?: number;
    monthlyCap?: number;
    sprintCapDefault?: number;
    sprintCaps?: SprintCap[];
    sprintLengthDays?: number;
    fteCurrent?: number;
    hoursPerDay?: number;
    autoBudgetFromFte?: boolean;
  }>(LS_BUDGET);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [projectStart, setProjectStart] = useState<string>(() => readLocalStorage<{ startDate?: string }>(LS_RANGE)?.startDate ?? "2026-03-01");
  const [projectEnd, setProjectEnd] = useState<string>(() => readLocalStorage<{ endDate?: string }>(LS_RANGE)?.endDate ?? "2026-05-31");
  const [sprintStart, setSprintStart] = useState<string>(() => readLocalStorage<{ sprintStart?: string }>(LS_RANGE)?.sprintStart ?? "2026-03-01");
  const [monthShown, setMonthShown] = useState<string>(() => readLocalStorage<{ monthShown?: string }>(LS_RANGE)?.monthShown ?? "2026-03-01");
  const [sprintWeeks, setSprintWeeks] = useState<number>(() => Math.max(1, Math.round((persistedBudget?.sprintLengthDays ?? 21) / 7)));
  const [totalBudget, setTotalBudget] = useState<number>(() => persistedBudget?.totalBudget ?? 300);
  const [monthlyCap, setMonthlyCap] = useState<number>(() => persistedBudget?.monthlyCap ?? 90);
  const [sprintCapDefault, setSprintCapDefault] = useState<number>(() => persistedBudget?.sprintCapDefault ?? 80);
  const [sprintCaps, setSprintCaps] = useState<SprintCap[]>(() => (persistedBudget?.sprintCaps?.length ? persistedBudget.sprintCaps : DEFAULT_SPRINT_CAPS));
  const [fteCurrent, setFteCurrent] = useState<number>(() => persistedBudget?.fteCurrent ?? 0.5);
  const [hoursPerDay, setHoursPerDay] = useState<number>(() => persistedBudget?.hoursPerDay ?? 8);
  const [autoBudgetFromFte, setAutoBudgetFromFte] = useState<boolean>(() => persistedBudget?.autoBudgetFromFte ?? true);
  const [tasks, setTasks] = useState<Task[]>(() => readLocalStorage<Task[]>(LS_TASKS)?.length ? readLocalStorage<Task[]>(LS_TASKS)! : DEFAULT_TASKS);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedDateISO, setSelectedDateISO] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>({ plannedToday: true, restSprint: true, restMonth: true, restTotal: true, sprintAvg: true });

  useEffect(() => void window.localStorage.setItem(LS_TASKS, JSON.stringify(tasks)), [tasks]);
  useEffect(() => void window.localStorage.setItem(LS_RANGE, JSON.stringify({ startDate: projectStart, endDate: projectEnd, sprintStart, monthShown })), [monthShown, projectEnd, projectStart, sprintStart]);
  useEffect(
    () =>
      void window.localStorage.setItem(
        LS_BUDGET,
        JSON.stringify({
          totalBudget,
          monthlyCap,
          sprintCaps,
          sprintCapDefault,
          sprintLengthDays: Math.max(1, Math.round(sprintWeeks)) * 7,
          fteCurrent,
          hoursPerDay,
          autoBudgetFromFte,
        })
      ),
    [autoBudgetFromFte, fteCurrent, hoursPerDay, monthlyCap, sprintCapDefault, sprintCaps, sprintWeeks, totalBudget]
  );

  const period = useMemo(() => {
    const ps = parseISODate(projectStart);
    const pe = parseISODate(projectEnd);
    return ps <= pe ? { start: ps, end: pe } : { start: pe, end: ps };
  }, [projectStart, projectEnd]);

  const workdaysInProject = useMemo(() => workdaysBetweenInclusive(period.start, period.end).length, [period.end, period.start]);
  const normalizedSprintWeeks = clamp(Number(sprintWeeks) || 1, 1, 12);
  const sprintCapacityCurrent = normalizedSprintWeeks * 5 * hoursPerDay * Math.max(0, fteCurrent);
  const totalCapacityCurrent = workdaysInProject * hoursPerDay * Math.max(0, fteCurrent);
  const derivedMonthlyCap = Math.max(0, Math.round((Math.max(0, fteCurrent) * hoursPerDay * 21.7) * 10) / 10);
  const derivedSprintCapDefault = Math.max(0, Math.round(sprintCapacityCurrent * 10) / 10);
  const derivedTotalBudget = Math.max(0, Math.round(totalCapacityCurrent * 10) / 10);
  const effectiveMonthlyCap = autoBudgetFromFte ? derivedMonthlyCap : monthlyCap;
  const effectiveSprintCapDefault = autoBudgetFromFte ? derivedSprintCapDefault : sprintCapDefault;
  const effectiveTotalBudget = autoBudgetFromFte ? derivedTotalBudget : totalBudget;
  const effectiveSprintCaps = autoBudgetFromFte ? [] : sprintCaps;

  const demandTotal = useMemo(
    () => tasks.reduce((sum, t) => (Number.isFinite(t.hours) && t.hours > 0 ? sum + t.hours : sum), 0),
    [tasks]
  );
  const gapCurrent = totalCapacityCurrent - demandTotal;
  const overloadedSprints = useMemo(() => {
    const bySprint = new Map<number, number>();
    for (const t of tasks) {
      const sprintNr = Number(t.sprintNr);
      const hours = Number(t.hours);
      if (!Number.isFinite(sprintNr) || sprintNr < 1 || !Number.isFinite(hours) || hours <= 0) continue;
      bySprint.set(sprintNr, (bySprint.get(sprintNr) ?? 0) + hours);
    }
    return Array.from(bySprint.entries())
      .sort((a, b) => a[0] - b[0])
      .filter(([, hours]) => hours > sprintCapacityCurrent)
      .map(([nr, hours]) => ({ nr, hours, gap: hours - sprintCapacityCurrent }));
  }, [sprintCapacityCurrent, tasks]);
  const { parsed, sprintDays, sprint1StartLabel, sprintAtProjectStart, dailyRows, burn, sprintStats, barData, sprints } = useDailyRows({
    projectStart,
    projectEnd,
    sprintStart,
    sprintWeeks,
    tasks,
    monthlyCap: effectiveMonthlyCap,
    totalBudget: effectiveTotalBudget,
    sprintCapDefault: effectiveSprintCapDefault,
    sprintCaps: effectiveSprintCaps,
  });

  const cal = useCalendar({
    monthShown,
    dailyRows,
    parsed,
    monthlyCap: effectiveMonthlyCap,
    totalBudget: effectiveTotalBudget,
    sprintCapDefault: effectiveSprintCapDefault,
    sprintDays,
    sprints,
    sprintAvg: sprintStats.avg,
  });
  const timeline = useTimeline({
    dailyRows,
    parsed,
    monthlyCap: effectiveMonthlyCap,
    totalBudget: effectiveTotalBudget,
    sprintCapDefault: effectiveSprintCapDefault,
    sprintDays,
    sprints,
    sprintAvg: sprintStats.avg,
  });
  const badge = useCallback((s: Status): string => (s === "ok" ? "bg-emerald-100 text-emerald-900" : "bg-white text-rose-900"), []);

  const remainingTotal = useMemo(() => {
    if (!dailyRows.length) return effectiveTotalBudget;
    return dailyRows[dailyRows.length - 1]?.remainingTotal ?? effectiveTotalBudget;
  }, [dailyRows, effectiveTotalBudget]);
  const monthlyFteHours = useMemo(() => {
    const byMonth = new Map<
      string,
      {
        label: string;
        workdays: number;
      }
    >();

    for (const r of dailyRows) {
      const day = r.date.getDay();
      if (day === 0 || day === 6) continue;
      const mk = r.mk;
      if (!byMonth.has(mk)) {
        const label = parseISODate(`${mk}-01`).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
        byMonth.set(mk, { label, workdays: 0 });
      }
      const month = byMonth.get(mk);
      if (month) month.workdays += 1;
    }

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([mk, v]) => {
        const currentHours = v.workdays * hoursPerDay * Math.max(0, fteCurrent);
        return {
          key: mk,
          label: v.label,
          workdays: v.workdays,
          currentHours,
        };
      });
  }, [dailyRows, fteCurrent, hoursPerDay]);
  const sprintStartBudgetRisk = useMemo(() => {
    const result: Array<{ sprintNr: number; date: Date; availableAtStart: number; remainingAfterDay: number }> = [];
    let prevSprintNr: number | null = null;

    for (const r of dailyRows) {
      if (r.sprintNr === null) continue;
      const isStart = prevSprintNr !== r.sprintNr;
      prevSprintNr = r.sprintNr;
      if (!isStart) continue;

      result.push({
        sprintNr: r.sprintNr,
        date: r.date,
        availableAtStart: r.remainingMonth + r.planned,
        remainingAfterDay: r.remainingMonth,
      });
    }

    return result;
  }, [dailyRows]);

  const statusChip = burn.dateMonthBreak
    ? { label: `Monatsbudget reißt ab: ${fmtDE(burn.dateMonthBreak)}`, cls: "bg-rose-100 text-rose-800 border-rose-200" }
    : { label: "Monatsbudget reicht im Zeitraum", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-6 md:py-8 space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Budget- & Sprintplanung</h1>
              <p className="text-sm text-slate-600 mt-2">
                Definiere Zeitraum, Budgets und Tasks. Die Ansichten zeigen sofort, wann ein Cap überschritten wird.
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-sm font-medium ${statusChip.cls}`}>{statusChip.label}</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex gap-2 flex-wrap">
            {burn.dateSprintBreak && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                Sprint-Cap kritisch ab {fmtDE(burn.dateSprintBreak)}
              </span>
            )}
            {burn.dateTotalBreak && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-800">
                Gesamtbudget kritisch ab {fmtDE(burn.dateTotalBreak)}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Geplant gesamt</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{burn.totalPlanned.toFixed(1)} h</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Rest Gesamtbudget</div>
              <div className={`mt-1 text-xl font-semibold ${remainingTotal < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                {remainingTotal.toFixed(1)} h
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Projektzeitraum</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {fmtDE(parsed.start)} - {fmtDE(parsed.end)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900">Nachweis: 0,x FTE vs Monatsbudget</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500 uppercase">Kundenszenario ({fteCurrent.toFixed(2)} FTE)</div>
                <div className="font-semibold mt-1">{totalCapacityCurrent.toFixed(1)} h Kapazität</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500 uppercase">Taskbedarf</div>
                <div className="font-semibold mt-1">{demandTotal.toFixed(1)} h</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-500 uppercase">Puffer / Fehlmenge</div>
                <div className={`font-semibold mt-1 ${gapCurrent < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {gapCurrent < 0 ? `${Math.abs(gapCurrent).toFixed(1)} h fehlen` : `${gapCurrent.toFixed(1)} h Puffer`}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              {gapCurrent < 0 ? (
                <p className="text-rose-700 font-medium">
                  Nachweis: Mit {fteCurrent.toFixed(2)} FTE reicht die Kapazität im Projektzeitraum nicht aus. Entweder Scope reduzieren/Tasks splitten oder Budget erhöhen.
                </p>
              ) : (
                <p className="text-emerald-700 font-medium">
                  Mit {fteCurrent.toFixed(2)} FTE ist der aktuelle Scope im Zeitraum rechnerisch abdeckbar.
                </p>
              )}
              {overloadedSprints.length > 0 && (
                <p className="text-slate-700 mt-1">
                  Überlastete Sprints:{" "}
                  {overloadedSprints
                    .slice(0, 4)
                    .map((s) => `Sprint ${s.nr} (+${s.gap.toFixed(1)}h)`)
                    .join(", ")}
                  {overloadedSprints.length > 4 ? " ..." : ""}
                </p>
              )}
              {sprintStartBudgetRisk.some((x) => x.availableAtStart <= 0) && (
                <p className="text-rose-700 mt-1 font-medium">
                  Kritisch: Mindestens ein Sprint startet in einem Monat mit 0h Restbudget.
                </p>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-semibold text-slate-900">FTE-Stunden pro Monat (exakte Arbeitstage)</div>
              <div className="text-xs text-slate-500 mt-1">
                Berechnung je Monat: Arbeitstage im Zeitraum × {hoursPerDay.toFixed(1)}h/Tag × FTE
              </div>
              <div className="overflow-auto mt-2">
                <table className="w-full min-w-[540px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b bg-slate-50">
                      <th className="py-2 px-2">Monat</th>
                      <th className="py-2 px-2">Arbeitstage</th>
                      <th className="py-2 px-2">{fteCurrent.toFixed(2)} FTE (h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyFteHours.map((m) => (
                      <tr key={m.key} className="border-b last:border-0">
                        <td className="py-2 px-2 font-medium text-slate-800">{m.label}</td>
                        <td className="py-2 px-2 text-slate-700">{m.workdays}</td>
                        <td className="py-2 px-2 text-slate-700">{m.currentHours.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-semibold text-slate-900">Sprintstart vs Monatsrest</div>
              <div className="text-xs text-slate-500 mt-1">
                Zeigt, ob zum Start eines Sprints im jeweiligen Monat noch Budget verfügbar ist.
              </div>
              <div className="overflow-auto mt-2">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b bg-slate-50">
                      <th className="py-2 px-2">Sprint</th>
                      <th className="py-2 px-2">Startdatum</th>
                      <th className="py-2 px-2">Monatsbudget bei Start</th>
                      <th className="py-2 px-2">Monatsrest nach Starttag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprintStartBudgetRisk.map((s) => (
                      <tr key={`${s.sprintNr}-${toISODate(s.date)}`} className="border-b last:border-0">
                        <td className="py-2 px-2 font-medium text-slate-800">Sprint {s.sprintNr}</td>
                        <td className="py-2 px-2 text-slate-700">{fmtDE(s.date)}</td>
                        <td className={`py-2 px-2 ${s.availableAtStart <= 0 ? "text-rose-700 font-semibold" : "text-slate-700"}`}>
                          {s.availableAtStart.toFixed(1)} h
                        </td>
                        <td className={`py-2 px-2 ${s.remainingAfterDay < 0 ? "text-rose-700 font-semibold" : "text-slate-700"}`}>
                          {s.remainingAfterDay.toFixed(1)} h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 items-start">
          <div className="xl:sticky xl:top-4">
            <ParameterPanel
              viewMode={viewMode}
              setViewMode={setViewMode}
              projectStart={projectStart}
              setProjectStart={setProjectStart}
              projectEnd={projectEnd}
              setProjectEnd={setProjectEnd}
              sprintWeeks={sprintWeeks}
              setSprintWeeks={setSprintWeeks}
              sprintStart={sprintStart}
              setSprintStart={setSprintStart}
              sprint1StartLabel={sprint1StartLabel}
              sprintAtProjectStart={sprintAtProjectStart}
              totalBudget={totalBudget}
              setTotalBudget={setTotalBudget}
              effectiveTotalBudget={effectiveTotalBudget}
              monthlyCap={monthlyCap}
              setMonthlyCap={setMonthlyCap}
              effectiveMonthlyCap={effectiveMonthlyCap}
              sprintCapDefault={sprintCapDefault}
              setSprintCapDefault={setSprintCapDefault}
              effectiveSprintCapDefault={effectiveSprintCapDefault}
              sprintCaps={sprintCaps}
              setSprintCaps={setSprintCaps}
              monthShown={monthShown}
              setMonthShown={setMonthShown}
              autoBudgetFromFte={autoBudgetFromFte}
              setAutoBudgetFromFte={setAutoBudgetFromFte}
              fteCurrent={fteCurrent}
              setFteCurrent={setFteCurrent}
              hoursPerDay={hoursPerDay}
              setHoursPerDay={setHoursPerDay}
              workdaysInProject={workdaysInProject}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              cardInfo={cardInfo}
              setCardInfo={setCardInfo}
              totalPlanned={burn.totalPlanned}
            />
          </div>

          <div className="space-y-4">
            <CalendarPanel
              viewMode={viewMode}
              parsed={parsed}
              monthlyCap={monthlyCap}
              cal={cal}
              timeline={timeline}
              barData={barData}
              badge={badge}
              cardInfo={cardInfo}
              monthShown={monthShown}
              setMonthShown={setMonthShown}
              selectedDateISO={selectedDateISO}
              setSelectedDateISO={setSelectedDateISO}
              dailyRows={dailyRows}
            />
            <TaskTable tasks={tasks} setTasks={setTasks} />
          </div>
        </div>
      </div>
    </div>
  );
}

function runSelfTests(): void {
  try {
    console.assert(toISODate(new Date(2026, 2, 1)) === "2026-03-01", "ISO Date failed");
    const s = buildSprints(new Date(2026, 2, 1), new Date(2026, 2, 31), new Date(2026, 2, 1), 3);
    console.assert(s.length >= 1 && s[0].nr === 1, "buildSprints failed");
    console.assert(sprintNrForDate(new Date(2026, 2, 1), new Date(2026, 1, 16), 21) === 1, "sprint nr failed");
    console.assert(workdaysBetweenInclusive(new Date(2026, 2, 2), new Date(2026, 2, 6)).length === 5, "workdaysBetweenInclusive failed");
    console.assert(typeof sprintTintClass(1) === "string", "tint class failed");
    console.assert(statusFor({ remainingMonth: 0, remainingTotal: 0, remainingSprint: 0 }) === "ok", "statusFor should be ok at 0");
    console.assert(statusFor({ remainingMonth: -0.01, remainingTotal: 10, remainingSprint: 10 }) === "bad", "statusFor should be bad when any < 0");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("SelfTests warning:", e);
  }
}

if (typeof window !== "undefined") runSelfTests();

export default function BudgetSprintDashboard(): JSX.Element {
  return (
    <ErrorBoundary>
      <BudgetSprintDashboardInner />
    </ErrorBoundary>
  );
}
