import React, { useMemo, useState } from "react";

/**
 * ErrorBoundary: zeigt Render-Fehler direkt in der UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Dashboard render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="font-semibold">Fehler im Dashboard</div>
            <div className="text-sm text-slate-700 mt-2">
              Bitte kopiere mir die Fehlermeldung aus dem Overlay/der Konsole hier rein.
            </div>
            <pre className="text-xs mt-3 whitespace-pre-wrap">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// -------------------------
// Helpers
// -------------------------
function toISODate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseISODate(s) {
  // erwartet YYYY-MM-DD; Fallback: heute
  if (!s || typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isWeekend(d) {
  const x = d.getDay();
  return x === 0 || x === 6;
}

function fmtDE(d) {
  return d.toLocaleDateString("de-DE");
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getSprintRange(sprintStart, sprintDays, sprintNr) {
  const start = addDays(sprintStart, (sprintNr - 1) * sprintDays);
  const end = addDays(start, sprintDays - 1);
  return { nr: sprintNr, start, end };
}

function sprintNrForDate(d, sprintStart, sprintDays) {
  if (d < sprintStart) return null;
  return Math.floor((d - sprintStart) / (24 * 3600 * 1000) / sprintDays) + 1;
}

function buildSprints(projectStart, projectEnd, sprintStart, sprintWeeks) {
  const sprintDays = sprintWeeks * 7;
  const s = [];
  const base = new Date(sprintStart);
  base.setHours(0, 0, 0, 0);

  const startNr = Math.max(1, sprintNrForDate(projectStart, base, sprintDays) || 1);
  const endNr = Math.max(startNr, sprintNrForDate(projectEnd, base, sprintDays) || startNr);

  for (let nr = startNr; nr <= endNr; nr++) {
    s.push(getSprintRange(base, sprintDays, nr));
  }

  return s;
}

function workdaysBetweenInclusive(a, b) {
  const days = [];
  let cur = new Date(a);
  cur.setHours(0, 0, 0, 0);

  const end = new Date(b);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    if (!isWeekend(cur)) days.push(new Date(cur));
    cur = addDays(cur, 1);
  }

  return days;
}

function calcDailyPlan({ projectStart, projectEnd, sprintStart, sprintWeeks, tasks }) {
  const sprintDays = sprintWeeks * 7;
  const sprintBase = new Date(sprintStart);
  sprintBase.setHours(0, 0, 0, 0);
  const sprints = buildSprints(projectStart, projectEnd, sprintBase, sprintWeeks);
  const dayHours = new Map();

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
      dayHours.set(k, (dayHours.get(k) || 0) + per);
    }
  }

  return { dayHours, sprints };
}

// Nur 2 Zustände: möglich / unmöglich
function statusFor({ remainingMonth, remainingTotal, remainingSprint }) {
  return remainingMonth < 0 || remainingTotal < 0 || remainingSprint < 0 ? "bad" : "ok";
}

function statusReasonFor({ remainingMonth, remainingTotal, remainingSprint, hasSprint }) {
  if (hasSprint && remainingSprint < 0) return "sprint";
  if (remainingMonth < 0) return "month";
  if (remainingTotal < 0) return "total";
  return "ok";
}

function statusLabelFor(reason) {
  if (reason === "sprint") return "Achtung: Sprint-Cap";
  if (reason === "month") return "Achtung: Monats-Cap";
  if (reason === "total") return "Achtung: Gesamtbudget";
  return "OK";
}

// VISUELL: Sprint-Tönung (einmalig deklariert)
function sprintTintClass(nr) {
  if (!nr) return "";
  const palette = [
    "bg-blue-50",
    "bg-indigo-50",
    "bg-violet-50",
    "bg-cyan-50",
    "bg-emerald-50",
    "bg-amber-50",
  ];
  return palette[(nr - 1) % palette.length];
}

// Kleine Self-Checks (keine Test-Runner nötig)
function runSelfTests() {
  try {
    console.assert(toISODate(new Date(2026, 2, 1)) === "2026-03-01", "ISO Date failed");

    const s = buildSprints(new Date(2026, 2, 1), new Date(2026, 2, 31), new Date(2026, 2, 1), 3);
    console.assert(s.length >= 1 && s[0].nr === 1, "buildSprints failed");
    console.assert(sprintNrForDate(new Date(2026, 2, 1), new Date(2026, 1, 16), 21) === 1, "sprint nr failed");

    const wd = workdaysBetweenInclusive(new Date(2026, 2, 2), new Date(2026, 2, 6)); // Mo–Fr
    console.assert(wd.length === 5, "workdaysBetweenInclusive failed");

    console.assert(typeof sprintTintClass(1) === "string", "tint class failed");

    const st = statusFor({ remainingMonth: 0, remainingTotal: 0, remainingSprint: 0 });
    console.assert(st === "ok", "statusFor should be ok at 0");

    const st2 = statusFor({ remainingMonth: -0.01, remainingTotal: 10, remainingSprint: 10 });
    console.assert(st2 === "bad", "statusFor should be bad when any < 0");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("SelfTests warning:", e);
  }
}
if (typeof window !== "undefined") runSelfTests();

// -------------------------
// UI Components
// -------------------------
function DayCell({ c, badge, cardInfo, isSelected, onSelect }) {
  const isMonthStart = c.d.getDate() === 1;
  const monthRestPct =
    typeof c.monthCap === "number" && c.monthCap > 0 ? Math.max(0, Math.min(100, (c.rM / c.monthCap) * 100)) : null;
  const monthBarClass = c.rM < 0 ? "bg-rose-500" : c.rM <= c.monthCap * 0.3 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div
      className={`relative border rounded-2xl p-2 min-h-[86px] ${badge(c.status)} ${sprintTintClass(
        c.sprintNr
      )} ${c.inProject ? "" : "opacity-40"} ${c.status === "bad" ? "ring-2 ring-rose-500 border-rose-500" : ""} ${
        isMonthStart ? "outline outline-2 outline-amber-400" : ""
      } ${isSelected ? "ring-2 ring-sky-500 border-sky-500" : ""}`}
      onClick={() => onSelect(toISODate(c.d))}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(toISODate(c.d));
      }}
      title={
        c.sprintNr
          ? `Sprint ${c.sprintNr} | ${c.statusLabel} | Geplant: ${c.planned.toFixed(1)}h | Restsprint Aufwand: ${c.rS.toFixed(
              1
            )}h | Rest Monat: ${c.rM.toFixed(1)}h | Rest Gesamt: ${c.rT.toFixed(1)}h`
          : `Kein Sprint aktiv | Geplant: ${c.planned.toFixed(1)}h | Rest Monat: ${c.rM.toFixed(
              1
            )}h | Rest Gesamt: ${c.rT.toFixed(1)}h`
      }
    >
      {/* Sprintwechsel: vertikale Linie am ersten Tag des Sprints */}
      {c.sprintStart && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />}
      {c.sprintStart && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[9px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">
          Sprintwechsel
        </div>
      )}

      {/* Monatsanfang: Label */}
      {isMonthStart && (
        <div className="absolute right-1 top-1 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
          Monat
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{c.d.getDate()}</div>
          <div className="text-[10px] text-slate-500">{c.d.toLocaleDateString("de-DE", { weekday: "short" })}</div>
          {c.sprintNr ? (
            <div className="text-[10px] text-slate-700">
              Sprint {c.sprintNr}
              {c.sprintDay ? ` - Tag ${c.sprintDay}/${c.sprintTotalDays}` : ""}
            </div>
          ) : (
            <div className="text-[10px] text-slate-500">Kein Sprint</div>
          )}
        </div>
        <div className={`text-[11px] font-medium ${c.status === "ok" ? "text-emerald-900" : "text-rose-700"}`}>
          {c.statusLabel}
        </div>
      </div>

      {cardInfo.plannedToday && <div className="mt-2 text-[11px] text-slate-800">{c.planned.toFixed(1)}h heute</div>}
      {cardInfo.restSprint &&
        (c.sprintNr ? (
          <div className="mt-1 text-[10px] text-slate-700">Restsprint Aufwand: {c.rS.toFixed(1)}h</div>
        ) : (
          <div className="mt-1 text-[10px] text-slate-500">Kein Sprint aktiv</div>
        ))}
      {cardInfo.restMonth && (
        <div className="mt-1">
          <div className="text-[10px] text-slate-700">Rest Monat: {c.rM.toFixed(1)}h</div>
          {typeof monthRestPct === "number" && (
            <div className="mt-1">
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full ${monthBarClass}`} style={{ width: `${monthRestPct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
      {cardInfo.restTotal && <div className="text-[10px] text-slate-700">Rest Gesamt: {c.rT.toFixed(1)}h</div>}

      {cardInfo.sprintAvg && typeof c.avg === "number" && Number.isFinite(c.avg) && (
        <div className="text-[10px] text-slate-500">Durchschnitt Sprint: {c.avg.toFixed(1)}h/AT</div>
      )}
    </div>
  );
}

function BarRow({ label, planned, cap }) {
  const pct = cap > 0 ? (planned / cap) * 100 : 0;
  const width = Math.max(0, Math.min(100, pct));
  const isOver = planned > cap;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className={`font-medium ${isOver ? "text-rose-700" : "text-slate-800"}`}>
          {planned.toFixed(1)}h / {cap.toFixed(1)}h
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-full ${isOver ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// -------------------------
// Main Component
// -------------------------
function BudgetSprintDashboardInner() {
  const [viewMode, setViewMode] = useState("month"); // "month" | "timeline" | "bars"

  const [projectStart, setProjectStart] = useState("2026-03-01");
  const [sprintStart, setSprintStart] = useState("2026-03-01");
  const [projectEnd, setProjectEnd] = useState("2026-05-31");
  const [sprintWeeks, setSprintWeeks] = useState(3);

  const [totalBudget, setTotalBudget] = useState(300);
  const [monthlyCap, setMonthlyCap] = useState(90);

  // Sprint-Caps: 1–4 individuell; danach Default
  const [sprintCapDefault, setSprintCapDefault] = useState(80);
  const [sprintCaps, setSprintCaps] = useState([
    { nr: 1, cap: 80 },
    { nr: 2, cap: 80 },
    { nr: 3, cap: 80 },
    { nr: 4, cap: 80 },
  ]);

  const [monthShown, setMonthShown] = useState("2026-03-01");
  const [tasks, setTasks] = useState([
    { id: "t1", name: "Task A", sprintNr: 1, hours: 80 },
    { id: "t2", name: "Task B", sprintNr: 2, hours: 80 },
    { id: "t3", name: "Task C", sprintNr: 3, hours: 80 },
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const [cardInfo, setCardInfo] = useState({
    plannedToday: true,
    restSprint: true,
    restMonth: true,
    restTotal: true,
    sprintAvg: true,
  });

  const parsed = useMemo(() => {
    const ps = parseISODate(projectStart);
    const pe = parseISODate(projectEnd);
    const ss = parseISODate(sprintStart);
    return ps <= pe ? { start: ps, end: pe, sprintStart: ss } : { start: pe, end: ps, sprintStart: ss };
  }, [projectStart, projectEnd, sprintStart]);

  const { dayHours, sprints } = useMemo(() => {
    return calcDailyPlan({
      projectStart: parsed.start,
      projectEnd: parsed.end,
      sprintStart: parsed.sprintStart,
      sprintWeeks: clamp(Number(sprintWeeks) || 1, 1, 12),
      tasks: tasks.map((t) => ({
        ...t,
        sprintNr: Number(t.sprintNr),
        hours: Number(t.hours),
      })),
    });
  }, [parsed.start, parsed.end, parsed.sprintStart, sprintWeeks, tasks]);

  const sprint1Start = parsed.sprintStart;
  const sprint1StartLabel = sprint1Start.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const sprintDays = clamp(Number(sprintWeeks) || 1, 1, 12) * 7;
  const sprintAtProjectStart = sprintNrForDate(parsed.start, parsed.sprintStart, sprintDays);

  const { dailyRows, burn } = useMemo(() => {
    const rows = [];

    let cur = new Date(parsed.start);
    cur.setHours(0, 0, 0, 0);

    const end = new Date(parsed.end);
    end.setHours(0, 0, 0, 0);

    const capMap = new Map(sprintCaps.map((s) => [Number(s.nr), Number(s.cap)]));

    let cumTotal = 0;
    const byMonth = new Map();
    const bySprint = new Map();

    let breakDate = null;

    while (cur <= end) {
      const key = toISODate(cur);
      const planned = dayHours.get(key) || 0;

      cumTotal += planned;

      const mk = monthKey(cur);
      byMonth.set(mk, (byMonth.get(mk) || 0) + planned);

      const sn = sprintNrForDate(cur, parsed.sprintStart, sprintDays);
      if (sn !== null) bySprint.set(sn, (bySprint.get(sn) || 0) + planned);

      const usedMonth = byMonth.get(mk) || 0;
      const usedSprint = sn !== null ? bySprint.get(sn) || 0 : 0;

      const capThis = sn !== null ? capMap.get(sn) ?? sprintCapDefault : null;
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
  }, [parsed.start, parsed.end, parsed.sprintStart, dayHours, monthlyCap, totalBudget, sprintDays, sprintCapDefault, sprintCaps]);

  // Zusatzinfos pro Sprint (für Avg Sprint h/AT)
  const sprintStats = useMemo(() => {
    const totals = new Map();
    const workdays = new Map();

    for (const r of dailyRows) {
      if (r.sprintNr === null) continue;
      totals.set(r.sprintNr, (totals.get(r.sprintNr) || 0) + r.planned);
      if (!isWeekend(r.date)) {
        workdays.set(r.sprintNr, (workdays.get(r.sprintNr) || 0) + 1);
      }
    }

    const avg = new Map();
    for (const [nr, total] of totals) {
      const wd = workdays.get(nr) || 1;
      avg.set(nr, total / wd);
    }

    return { totals, workdays, avg };
  }, [dailyRows]);

  const badge = (s) =>
    s === "ok" ? "bg-emerald-100 text-emerald-900" : "bg-white text-rose-900";

  // Month view: 6x7 grid
  const cal = useMemo(() => {
    const m = parseISODate(monthShown);
    const first = startOfMonth(m);
    const weekdayMon0 = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -weekdayMon0);

    const cells = [];
    const byISO = new Map(dailyRows.map((r) => [toISODate(r.date), r]));
    const sprintStartSet = new Set(sprints.map((s) => toISODate(s.start)));

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
      const sprintDay = sprintRange ? Math.floor((d - sprintRange.start) / (24 * 3600 * 1000)) + 1 : null;
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
        avg: sprintStats.avg.get(sprintNr),
      });
    }

    const mk = monthKey(m);
    const monthPlanned = dailyRows.filter((r) => r.mk === mk).reduce((a, b) => a + b.planned, 0);

    return { month: m, cells, monthPlanned };
  }, [monthShown, dailyRows, parsed.start, parsed.end, parsed.sprintStart, monthlyCap, totalBudget, sprintCapDefault, sprintDays, sprints, sprintStats]);

  // Timeline view: fortlaufende Wochen (scrollbar)
  const timeline = useMemo(() => {
    const byISO = new Map(dailyRows.map((r) => [toISODate(r.date), r]));
    const sprintStartSet = new Set(sprints.map((s) => toISODate(s.start)));

    // Start auf Montag vor Projektstart
    const start = new Date(parsed.start);
    start.setHours(0, 0, 0, 0);
    const startMonOffset = (start.getDay() + 6) % 7;
    const gridStart = addDays(start, -startMonOffset);

    // Ende auf Sonntag nach Projektende
    const end = new Date(parsed.end);
    end.setHours(0, 0, 0, 0);
    const endSunOffset = 6 - ((end.getDay() + 6) % 7);
    const gridEnd = addDays(end, endSunOffset);

    const weeks = [];
    let cur = new Date(gridStart);

    while (cur <= gridEnd) {
      const week = [];

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
        const sprintDay = sprintRange ? Math.floor((d - sprintRange.start) / (24 * 3600 * 1000)) + 1 : null;
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
          avg: sprintStats.avg.get(sprintNr),
        });

        cur = addDays(cur, 1);
      }

      // Monatslabel: wenn in dieser Woche der 1. vorkommt
      const monthStartCell = week.find((c) => c.d.getDate() === 1);
      const monthLabel = monthStartCell
        ? monthStartCell.d.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
        : null;

      weeks.push({ week, monthLabel });
    }

    return { weeks };
  }, [dailyRows, parsed.start, parsed.end, parsed.sprintStart, monthlyCap, totalBudget, sprintCapDefault, sprintDays, sprints, sprintStats]);

  const barData = useMemo(() => {
    const totalPlanned = dailyRows.reduce((sum, r) => sum + r.planned, 0);

    const monthMap = new Map();
    for (const r of dailyRows) {
      monthMap.set(r.mk, (monthMap.get(r.mk) || 0) + r.planned);
    }
    const months = Array.from(monthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([mk, planned]) => ({
        key: mk,
        label: parseISODate(`${mk}-01`).toLocaleDateString("de-DE", { month: "long", year: "numeric" }),
        planned,
        cap: monthlyCap,
      }));

    const capMap = new Map(sprintCaps.map((s) => [Number(s.nr), Number(s.cap)]));
    const sprintMap = new Map();
    for (const r of dailyRows) {
      if (r.sprintNr === null) continue;
      const current = sprintMap.get(r.sprintNr) || { planned: 0 };
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
  }, [dailyRows, monthlyCap, totalBudget, sprintCaps, sprintCapDefault]);

  const selectedDayInfo = useMemo(() => {
    if (!selectedDateISO) return null;
    const selectedDate = parseISODate(selectedDateISO);
    const row = dailyRows.find((r) => toISODate(r.date) === selectedDateISO);

    if (!row) {
      return {
        selectedDate,
        inProject: false,
      };
    }

    const currentSprintNr = row.sprintNr;
    const openTaskEffort =
      currentSprintNr === null
        ? 0
        : dailyRows
            .filter((r) => r.sprintNr === currentSprintNr && r.date >= row.date)
            .reduce((sum, r) => sum + r.planned, 0);
    const remainingMonthEffort = dailyRows
      .filter((r) => r.mk === row.mk && r.date >= row.date)
      .reduce((sum, r) => sum + r.planned, 0);
    const remainingMonthBudget = row.remainingMonth;
    const remainingProjectBudget = row.remainingTotal;
    const neededBudget = openTaskEffort;
    const budgetGap = remainingProjectBudget - neededBudget;
    const additionalMonthBudgetNeeded = Math.max(0, remainingMonthEffort - remainingMonthBudget);

    return {
      selectedDate: row.date,
      inProject: true,
      sprintNr: currentSprintNr,
      remainingMonthBudget,
      remainingProjectBudget,
      remainingMonthEffort,
      additionalMonthBudgetNeeded,
      openTaskEffort,
      neededBudget,
      budgetGap,
    };
  }, [selectedDateISO, dailyRows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Budget/Sprint Dashboard</h1>
          <div className="text-sm text-slate-600 mt-1">
            Parametrisch: Projektzeitraum - Sprintlänge - Gesamtbudget - Monatscap - Sprintcaps - Tasks
          </div>
        </div>
        <div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${badge(burn.dateBudgetBreak ? "bad" : "ok")}`}
          >
            {burn.dateBudgetBreak
              ? `Budget reißt ab: ${fmtDE(burn.dateBudgetBreak)}`
              : "Budget reicht im Zeitraum"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Parameter */}
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold">Parameter</h2>

          <div className="mt-3">
            <div className="text-sm text-slate-600">Ansicht</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={`rounded-xl px-3 py-2 text-sm border ${
                  viewMode === "month"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => setViewMode("month")}
              >
                Monat
              </button>
              <button
                type="button"
                className={`rounded-xl px-3 py-2 text-sm border ${
                  viewMode === "timeline"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => setViewMode("timeline")}
              >
                Timeline (scroll)
              </button>
              <button
                type="button"
                className={`rounded-xl px-3 py-2 text-sm border ${
                  viewMode === "bars"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => setViewMode("bars")}
              >
                Balkendiagramm
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Monat = klassischer Monatskalender - Timeline = fortlaufende Wochen - Balkendiagramm = aggregierte Auswertung.
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Erweitert ausblenden" : "Erweitert einblenden"}
            </button>
            <div className="text-xs text-slate-500 mt-2">
              Basis zeigt nur Pflichtfelder. Erweitert enthält Feinsteuerung und Anzeigeoptionen.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="text-sm">
              <div className="text-slate-600">Projektstart</div>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                type="date"
                value={projectStart}
                onChange={(e) => setProjectStart(e.target.value)}
              />
            </label>

            <label className="text-sm">
              <div className="text-slate-600">Projektende</div>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                type="date"
                value={projectEnd}
                onChange={(e) => setProjectEnd(e.target.value)}
              />
            </label>

            <label className="text-sm">
              <div className="text-slate-600">Sprintlänge (Wochen)</div>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                type="number"
                min={1}
                max={12}
                value={sprintWeeks}
                onChange={(e) => setSprintWeeks(Number(e.target.value))}
              />
            </label>

            <label className="text-sm col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 block">
              <div className="text-slate-600">Start Sprint 1</div>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                type="date"
                value={sprintStart}
                onChange={(e) => setSprintStart(e.target.value)}
              />
              <div className="text-xs text-slate-600 mt-1 capitalize">
                {sprint1StartLabel}
                {sprintAtProjectStart ? ` - Projektstart liegt in Sprint ${sprintAtProjectStart}` : ""}
              </div>
            </label>

            <label className="text-sm">
              <div className="text-slate-600">Gesamtbudget (h)</div>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                type="number"
                min={0}
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
              />
            </label>

            <label className="text-sm">
              <div className="text-slate-600">Monats-Cap (h)</div>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                type="number"
                min={0}
                value={monthlyCap}
                onChange={(e) => setMonthlyCap(Number(e.target.value))}
              />
              <div className="text-xs text-slate-500 mt-1">Max. Stunden pro Kalendermonat.</div>
            </label>

            {showAdvanced && (
              <label className="text-sm">
                <div className="text-slate-600">Sprint-Cap Default (h)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  type="number"
                  min={0}
                  value={sprintCapDefault}
                  onChange={(e) => setSprintCapDefault(Number(e.target.value))}
                />
                <div className="text-xs text-slate-500 mt-1">Fallback, wenn Sprint keinen eigenen Cap hat.</div>
              </label>
            )}

            {showAdvanced && (
              <label className="text-sm col-span-2">
                <div className="text-slate-600">Monat anzeigen</div>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  type="date"
                  value={monthShown}
                  onChange={(e) => setMonthShown(e.target.value)}
                />
                <div className="text-xs text-slate-500 mt-1">Tipp: den 1. des Monats wählen.</div>
              </label>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-600">Karteninfos anzeigen</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cardInfo.plannedToday}
                  onChange={(e) => setCardInfo((p) => ({ ...p, plannedToday: e.target.checked }))}
                />
                Heute
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cardInfo.restSprint}
                  onChange={(e) => setCardInfo((p) => ({ ...p, restSprint: e.target.checked }))}
                />
                Restsprint Aufwand
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cardInfo.restMonth}
                  onChange={(e) => setCardInfo((p) => ({ ...p, restMonth: e.target.checked }))}
                />
                Rest Monat
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cardInfo.restTotal}
                  onChange={(e) => setCardInfo((p) => ({ ...p, restTotal: e.target.checked }))}
                />
                Rest Gesamt
              </label>
              <label className="inline-flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={cardInfo.sprintAvg}
                  onChange={(e) => setCardInfo((p) => ({ ...p, sprintAvg: e.target.checked }))}
                />
                Durchschnitt Sprint
              </label>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Geplant gesamt</span>
              <span className="font-semibold">{burn.totalPlanned.toFixed(1)} h</span>
            </div>
          </div>
        </div>

        {/* Kalender */}
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm lg:col-span-2">
          {viewMode === "month" ? (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-semibold">
                  Kalender: {cal.month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                </h2>
                <div className="text-sm text-slate-600">
                  Monat geplant: <span className="font-semibold">{cal.monthPlanned.toFixed(1)} h</span> / Cap {monthlyCap}h
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mt-3 text-xs text-slate-600">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                  <div key={d} className="px-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 mt-2">
                {cal.cells.map((c, i) => (
                  <DayCell
                    key={i}
                    c={c}
                    badge={badge}
                    cardInfo={cardInfo}
                    isSelected={toISODate(c.d) === selectedDateISO}
                    onSelect={setSelectedDateISO}
                  />
                ))}
              </div>
            </>
          ) : viewMode === "timeline" ? (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-semibold">Timeline (fortlaufend)</h2>
                <div className="text-sm text-slate-600">
                  Projekt: {fmtDE(parsed.start)} – {fmtDE(parsed.end)}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mt-3 text-xs text-slate-600">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                  <div key={d} className="px-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-2 max-h-[520px] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {timeline.weeks.map((w, wi) => (
                    <div key={wi}>
                      {w.monthLabel && (
                        <div className="sticky top-0 z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white shadow-sm text-sm font-medium">
                            {w.monthLabel}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {w.week.map((c, di) => (
                          <DayCell
                            key={`${wi}-${di}`}
                            c={c}
                            badge={badge}
                            cardInfo={cardInfo}
                            isSelected={toISODate(c.d) === selectedDateISO}
                            onSelect={setSelectedDateISO}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-semibold">Balkendiagramm (Auswertung)</h2>
                <div className="text-sm text-slate-600">
                  Projekt: {fmtDE(parsed.start)} – {fmtDE(parsed.end)}
                </div>
              </div>

              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-semibold mb-2">Gesamtbudget</div>
                  <BarRow label="Gesamt" planned={barData.total.planned} cap={barData.total.cap} />
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-semibold mb-2">Monate</div>
                  <div className="space-y-3">
                    {barData.months.map((m) => (
                      <BarRow key={m.key} label={m.label} planned={m.planned} cap={m.cap} />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-semibold mb-2">Sprints</div>
                  <div className="space-y-3">
                    {barData.sprints.map((s) => (
                      <BarRow key={s.nr} label={`Sprint ${s.nr}`} planned={s.planned} cap={s.cap} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm">Details zum ausgewaehlten Tag</h3>
              {selectedDayInfo?.selectedDate && (
                <div className="text-xs text-slate-600">{fmtDE(selectedDayInfo.selectedDate)}</div>
              )}
            </div>

            {!selectedDayInfo ? (
              <div className="text-sm text-slate-500 mt-2">Bitte einen Tag anklicken.</div>
            ) : !selectedDayInfo.inProject ? (
              <div className="text-sm text-slate-500 mt-2">Der ausgewaehlte Tag liegt ausserhalb des Projektzeitraums.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3 text-sm">
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-slate-600">Budget uebrig (Monat)</div>
                  <div className="font-semibold">{selectedDayInfo.remainingMonthBudget.toFixed(1)}h</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-slate-600">Budget uebrig (Projektzeitraum)</div>
                  <div className="font-semibold">{selectedDayInfo.remainingProjectBudget.toFixed(1)}h</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-slate-600">Zusaetzliches Budget noetig (Monat)</div>
                  <div className="font-semibold">{selectedDayInfo.additionalMonthBudgetNeeded.toFixed(1)}h</div>
                  <div className="text-xs mt-1 text-slate-600">
                    Restaufwand Monat: {selectedDayInfo.remainingMonthEffort.toFixed(1)}h
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-slate-600">
                    Offener Task-Aufwand
                    {selectedDayInfo.sprintNr ? ` (Sprint ${selectedDayInfo.sprintNr})` : ""}
                  </div>
                  <div className="font-semibold">{selectedDayInfo.openTaskEffort.toFixed(1)}h</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-slate-600">
                    Noetiges Budget
                    {selectedDayInfo.sprintNr ? ` (bis Ende Sprint ${selectedDayInfo.sprintNr})` : ""}
                  </div>
                  <div className="font-semibold">{selectedDayInfo.neededBudget.toFixed(1)}h</div>
                  <div className={`text-xs mt-1 ${selectedDayInfo.budgetGap >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {selectedDayInfo.budgetGap >= 0
                      ? `Puffer: ${selectedDayInfo.budgetGap.toFixed(1)}h`
                      : `Fehlend: ${Math.abs(selectedDayInfo.budgetGap).toFixed(1)}h`}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-600 flex gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full ${badge("ok")}`}>Grün: Planung möglich</span>
            <span className={`px-2 py-1 rounded-full ${badge("bad")}`}>Rot: Planung unmöglich</span>
            <span className="px-2 py-1 rounded-full border border-slate-300">Sprintwechsel: blaue vertikale Linie</span>
            <span className="px-2 py-1 rounded-full border border-slate-300">Sprint-Blöcke: dezente Hintergrundtönung</span>
            <span className="px-2 py-1 rounded-full border border-slate-300">Monatsanfang: gelbe Outline + Label</span>
          </div>
        </div>

        {showAdvanced && (
          <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h2 className="font-semibold">Sprint-Caps (1–4)</h2>
            <div className="text-xs text-slate-600 mt-1">Setze hier die Max-Stunden pro Sprint.</div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {sprintCaps.map((sc) => (
                <label key={sc.nr} className="text-sm">
                  <div className="text-slate-600">Sprint {sc.nr} (h)</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    type="number"
                    min={0}
                    value={sc.cap}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSprintCaps((prev) => prev.map((x) => (x.nr === sc.nr ? { ...x, cap: v } : x)));
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="text-xs text-slate-500 mt-3">Hinweis: Sprints außerhalb 1–4 nutzen den Default.</div>
          </div>
        )}

        {/* Tasks */}
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold">Tasks</h2>
            <button
              className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm"
              onClick={() => {
                const id = `t${Math.random().toString(16).slice(2)}`;
                setTasks((prev) => [...prev, { id, name: "Neuer Task", sprintNr: 1, hours: 80 }]);
              }}
              type="button"
            >
              + Task
            </button>
          </div>

          <div className="overflow-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Task</th>
                  <th className="py-2 pr-3">SprintNr</th>
                  <th className="py-2 pr-3">Stunden</th>
                  <th className="py-2 pr-3">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2 pr-3">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={t.name}
                        onChange={(e) =>
                          setTasks((prev) =>
                            prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-28 rounded-xl border border-slate-300 px-3 py-2"
                        type="number"
                        min={1}
                        value={t.sprintNr}
                        onChange={(e) =>
                          setTasks((prev) =>
                            prev.map((x) => (x.id === t.id ? { ...x, sprintNr: Number(e.target.value) } : x))
                          )
                        }
                      />
                      <div className="text-xs text-slate-500 mt-1">Sprint-Index ab Start von Sprint 1</div>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-32 rounded-xl border border-slate-300 px-3 py-2"
                        type="number"
                        min={0}
                        step={0.5}
                        value={t.hours}
                        onChange={(e) =>
                          setTasks((prev) =>
                            prev.map((x) => (x.id === t.id ? { ...x, hours: Number(e.target.value) } : x))
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                        type="button"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-600">
            Logik: Task-Stunden werden gleichmäßig auf Arbeitstage des zugewiesenen Sprints verteilt, damit Monatsgrenzen sauber berücksichtigt werden.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BudgetSprintDashboard() {
  return (
    <ErrorBoundary>
      <BudgetSprintDashboardInner />
    </ErrorBoundary>
  );
}


