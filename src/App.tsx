import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";
import type { CardInfo, SprintCap, Status, Task, ViewMode } from "./types";
import TaskTable from "./components/TaskTable";
import ParameterPanel from "./components/ParameterPanel";
import CalendarPanel from "./components/CalendarPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import { useDailyRows } from "./hooks/useDailyRows";
import { useCalendar } from "./hooks/useCalendar";
import { useTimeline } from "./hooks/useTimeline";
import { fmtDE, toISODate, workdaysBetweenInclusive } from "./utils/dateUtils";
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
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [projectStart, setProjectStart] = useState<string>(() => readLocalStorage<{ startDate?: string }>(LS_RANGE)?.startDate ?? "2026-03-01");
  const [projectEnd, setProjectEnd] = useState<string>(() => readLocalStorage<{ endDate?: string }>(LS_RANGE)?.endDate ?? "2026-05-31");
  const [sprintStart, setSprintStart] = useState<string>(() => readLocalStorage<{ sprintStart?: string }>(LS_RANGE)?.sprintStart ?? "2026-03-01");
  const [monthShown, setMonthShown] = useState<string>(() => readLocalStorage<{ monthShown?: string }>(LS_RANGE)?.monthShown ?? "2026-03-01");
  const [sprintWeeks, setSprintWeeks] = useState<number>(() => Math.max(1, Math.round((readLocalStorage<{ sprintLengthDays?: number }>(LS_BUDGET)?.sprintLengthDays ?? 21) / 7)));
  const [totalBudget, setTotalBudget] = useState<number>(() => readLocalStorage<{ totalBudget?: number }>(LS_BUDGET)?.totalBudget ?? 300);
  const [monthlyCap, setMonthlyCap] = useState<number>(() => readLocalStorage<{ monthlyCap?: number }>(LS_BUDGET)?.monthlyCap ?? 90);
  const [sprintCapDefault, setSprintCapDefault] = useState<number>(() => readLocalStorage<{ sprintCapDefault?: number }>(LS_BUDGET)?.sprintCapDefault ?? 80);
  const [sprintCaps, setSprintCaps] = useState<SprintCap[]>(() => readLocalStorage<{ sprintCaps?: SprintCap[] }>(LS_BUDGET)?.sprintCaps?.length ? readLocalStorage<{ sprintCaps?: SprintCap[] }>(LS_BUDGET)!.sprintCaps! : DEFAULT_SPRINT_CAPS);
  const [tasks, setTasks] = useState<Task[]>(() => readLocalStorage<Task[]>(LS_TASKS)?.length ? readLocalStorage<Task[]>(LS_TASKS)! : DEFAULT_TASKS);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedDateISO, setSelectedDateISO] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>({ plannedToday: true, restSprint: true, restMonth: true, restTotal: true, sprintAvg: true });

  useEffect(() => void window.localStorage.setItem(LS_TASKS, JSON.stringify(tasks)), [tasks]);
  useEffect(() => void window.localStorage.setItem(LS_RANGE, JSON.stringify({ startDate: projectStart, endDate: projectEnd, sprintStart, monthShown })), [monthShown, projectEnd, projectStart, sprintStart]);
  useEffect(() => void window.localStorage.setItem(LS_BUDGET, JSON.stringify({ totalBudget, monthlyCap, sprintCaps, sprintCapDefault, sprintLengthDays: Math.max(1, Math.round(sprintWeeks)) * 7 })), [monthlyCap, sprintCapDefault, sprintCaps, sprintWeeks, totalBudget]);

  const { parsed, sprintDays, sprint1StartLabel, sprintAtProjectStart, dailyRows, burn, sprintStats, barData, sprints } = useDailyRows({
    projectStart,
    projectEnd,
    sprintStart,
    sprintWeeks,
    tasks,
    monthlyCap,
    totalBudget,
    sprintCapDefault,
    sprintCaps,
  });

  const cal = useCalendar({ monthShown, dailyRows, parsed, monthlyCap, totalBudget, sprintCapDefault, sprintDays, sprints, sprintAvg: sprintStats.avg });
  const timeline = useTimeline({ dailyRows, parsed, monthlyCap, totalBudget, sprintCapDefault, sprintDays, sprints, sprintAvg: sprintStats.avg });
  const badge = useCallback((s: Status): string => (s === "ok" ? "bg-emerald-100 text-emerald-900" : "bg-white text-rose-900"), []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Budget/Sprint Dashboard</h1>
          <div className="text-sm text-slate-600 mt-1">Parametrisch: Projektzeitraum - Sprintlänge - Gesamtbudget - Monatscap - Sprintcaps - Tasks</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${badge(burn.dateBudgetBreak ? "bad" : "ok")}`}>
          {burn.dateBudgetBreak ? `Budget reißt ab: ${fmtDE(burn.dateBudgetBreak)}` : "Budget reicht im Zeitraum"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
          monthlyCap={monthlyCap}
          setMonthlyCap={setMonthlyCap}
          sprintCapDefault={sprintCapDefault}
          setSprintCapDefault={setSprintCapDefault}
          sprintCaps={sprintCaps}
          setSprintCaps={setSprintCaps}
          monthShown={monthShown}
          setMonthShown={setMonthShown}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          cardInfo={cardInfo}
          setCardInfo={setCardInfo}
          totalPlanned={burn.totalPlanned}
        />

        <CalendarPanel
          viewMode={viewMode}
          parsed={parsed}
          monthlyCap={monthlyCap}
          cal={cal}
          timeline={timeline}
          barData={barData}
          badge={badge}
          cardInfo={cardInfo}
          selectedDateISO={selectedDateISO}
          setSelectedDateISO={setSelectedDateISO}
          dailyRows={dailyRows}
        />

        <TaskTable tasks={tasks} setTasks={setTasks} />
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
