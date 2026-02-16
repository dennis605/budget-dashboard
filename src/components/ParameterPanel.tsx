import type { Dispatch, JSX, SetStateAction } from "react";
import type { CardInfo, SprintCap, ViewMode } from "../types";

interface ParameterPanelProps {
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  projectStart: string;
  setProjectStart: Dispatch<SetStateAction<string>>;
  projectEnd: string;
  setProjectEnd: Dispatch<SetStateAction<string>>;
  sprintWeeks: number;
  setSprintWeeks: Dispatch<SetStateAction<number>>;
  sprintStart: string;
  setSprintStart: Dispatch<SetStateAction<string>>;
  sprint1StartLabel: string;
  sprintAtProjectStart: number | null;
  totalBudget: number;
  setTotalBudget: Dispatch<SetStateAction<number>>;
  effectiveTotalBudget: number;
  monthlyCap: number;
  setMonthlyCap: Dispatch<SetStateAction<number>>;
  effectiveMonthlyCap: number;
  sprintCapDefault: number;
  setSprintCapDefault: Dispatch<SetStateAction<number>>;
  effectiveSprintCapDefault: number;
  sprintCaps: SprintCap[];
  setSprintCaps: Dispatch<SetStateAction<SprintCap[]>>;
  monthShown: string;
  setMonthShown: Dispatch<SetStateAction<string>>;
  autoBudgetFromFte: boolean;
  setAutoBudgetFromFte: Dispatch<SetStateAction<boolean>>;
  fteCurrent: number;
  setFteCurrent: Dispatch<SetStateAction<number>>;
  hoursPerDay: number;
  setHoursPerDay: Dispatch<SetStateAction<number>>;
  workdaysInProject: number;
  showAdvanced: boolean;
  setShowAdvanced: Dispatch<SetStateAction<boolean>>;
  cardInfo: CardInfo;
  setCardInfo: Dispatch<SetStateAction<CardInfo>>;
  totalPlanned: number;
}

export default function ParameterPanel({
  viewMode,
  setViewMode,
  projectStart,
  setProjectStart,
  projectEnd,
  setProjectEnd,
  sprintWeeks,
  setSprintWeeks,
  sprintStart,
  setSprintStart,
  sprint1StartLabel,
  sprintAtProjectStart,
  totalBudget,
  setTotalBudget,
  effectiveTotalBudget,
  monthlyCap,
  setMonthlyCap,
  effectiveMonthlyCap,
  sprintCapDefault,
  setSprintCapDefault,
  effectiveSprintCapDefault,
  sprintCaps,
  setSprintCaps,
  monthShown,
  setMonthShown,
  autoBudgetFromFte,
  setAutoBudgetFromFte,
  fteCurrent,
  setFteCurrent,
  hoursPerDay,
  setHoursPerDay,
  workdaysInProject,
  showAdvanced,
  setShowAdvanced,
  cardInfo,
  setCardInfo,
  totalPlanned,
}: ParameterPanelProps): JSX.Element {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Steuerung</h2>
        <div className="text-xs text-slate-500">Geplant: {totalPlanned.toFixed(1)} h</div>
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">Ansicht</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`rounded-xl px-2 py-2 text-xs border transition ${
              viewMode === "month" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => setViewMode("month")}
          >
            Monat
          </button>
          <button
            type="button"
            className={`rounded-xl px-2 py-2 text-xs border transition ${
              viewMode === "timeline" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => setViewMode("timeline")}
          >
            Timeline
          </button>
          <button
            type="button"
            className={`rounded-xl px-2 py-2 text-xs border transition ${
              viewMode === "bars" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => setViewMode("bars")}
          >
            Balken
          </button>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-medium text-slate-800">Zeitraum & Sprint-Rhythmus</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-sm">
            <div className="text-slate-600">Projektstart</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              type="date"
              value={projectStart}
              onChange={(e) => setProjectStart(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <div className="text-slate-600">Projektende</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              type="date"
              value={projectEnd}
              onChange={(e) => setProjectEnd(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <div className="text-slate-600">Sprintlänge</div>
            <div className="mt-1 relative">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-14"
                type="number"
                min={1}
                max={12}
                value={sprintWeeks}
                onChange={(e) => setSprintWeeks(Number(e.target.value))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Wochen</span>
            </div>
          </label>

          <label className="text-sm col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 block">
            <div className="text-slate-600">Start Sprint 1</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
              type="date"
              value={sprintStart}
              onChange={(e) => setSprintStart(e.target.value)}
            />
            <div className="text-xs text-slate-600 mt-1">
              {sprint1StartLabel}
              {sprintAtProjectStart ? ` · Projektstart liegt in Sprint ${sprintAtProjectStart}` : ""}
            </div>
          </label>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium text-slate-800">FTE-Szenario</div>
          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={autoBudgetFromFte}
              onChange={(e) => setAutoBudgetFromFte(e.target.checked)}
            />
            Budget automatisch aus FTE ableiten
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-sm col-span-2">
            <div className="text-slate-600">Kunden-FTE</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              type="number"
              min={0}
              step={0.1}
              value={fteCurrent}
              onChange={(e) => setFteCurrent(Number(e.target.value))}
            />
          </label>
          <label className="text-sm col-span-2">
            <div className="text-slate-600">Stunden pro Arbeitstag</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              type="number"
              min={1}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          Projektarbeitstage: {workdaysInProject} ·
          abgeleitetes Budget: {effectiveTotalBudget.toFixed(1)}h · Monats-Cap: {effectiveMonthlyCap.toFixed(1)}h
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-medium text-slate-800">Budget-Grenzen</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-sm">
            <div className="text-slate-600">Gesamtbudget (h)</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
              type="number"
              min={0}
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              disabled={autoBudgetFromFte}
            />
            {autoBudgetFromFte && <div className="text-xs text-slate-500 mt-1">Auto: {effectiveTotalBudget.toFixed(1)}h</div>}
          </label>

          <label className="text-sm">
            <div className="text-slate-600">Monats-Cap (h)</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
              type="number"
              min={0}
              value={monthlyCap}
              onChange={(e) => setMonthlyCap(Number(e.target.value))}
              disabled={autoBudgetFromFte}
            />
            <div className="text-xs text-slate-500 mt-1">
              {autoBudgetFromFte ? `Auto: ${effectiveMonthlyCap.toFixed(1)}h` : "Maximal pro Kalendermonat."}
            </div>
          </label>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-800">Karteninfos</div>
          <button
            type="button"
            className="text-xs rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-50"
            onClick={() =>
              setCardInfo({
                plannedToday: true,
                restSprint: true,
                restMonth: true,
                restTotal: true,
                sprintAvg: true,
              })
            }
          >
            Alle an
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={cardInfo.plannedToday}
              onChange={(e) => setCardInfo((p) => ({ ...p, plannedToday: e.target.checked }))}
            />
            Geplant heute
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={cardInfo.restSprint}
              onChange={(e) => setCardInfo((p) => ({ ...p, restSprint: e.target.checked }))}
            />
            Rest Sprint
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
            Sprint-Durchschnitt
          </label>
        </div>
      </section>

      <div className="mt-3">
        <button
          type="button"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "Erweiterte Optionen ausblenden" : "Erweiterte Optionen einblenden"}
        </button>
      </div>

      {showAdvanced && (
        <section className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="text-sm font-medium text-slate-800">Erweitert</div>

          <label className="text-sm block">
            <div className="text-slate-600">Sprint-Cap Default (h)</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
              type="number"
              min={0}
              value={sprintCapDefault}
              onChange={(e) => setSprintCapDefault(Number(e.target.value))}
              disabled={autoBudgetFromFte}
            />
            {autoBudgetFromFte && <div className="text-xs text-slate-500 mt-1">Auto: {effectiveSprintCapDefault.toFixed(1)}h</div>}
          </label>

          <label className="text-sm block">
            <div className="text-slate-600">Monat anzeigen</div>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              type="date"
              value={monthShown}
              onChange={(e) => setMonthShown(e.target.value)}
            />
            <div className="text-xs text-slate-500 mt-1">Für Monatsansicht ideal: den 1. des Monats wählen.</div>
          </label>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-800">Sprint-Caps</h3>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  const nextNr = sprintCaps.length ? Math.max(...sprintCaps.map((s) => s.nr)) + 1 : 1;
                  setSprintCaps((prev) => [...prev, { nr: nextNr, cap: sprintCapDefault }]);
                }}
                disabled={autoBudgetFromFte}
              >
                + Sprint
              </button>
            </div>
            {autoBudgetFromFte && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                Im FTE-Auto-Modus sind individuelle Sprint-Caps deaktiviert. Es gilt der abgeleitete Sprint-Default.
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 gap-2">
              {sprintCaps
                .slice()
                .sort((a, b) => a.nr - b.nr)
                .map((sc) => (
                  <div key={sc.nr} className="rounded-lg border border-slate-200 p-2 flex items-center gap-2">
                    <div className="text-sm text-slate-700 w-24 shrink-0">Sprint {sc.nr}</div>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                      type="number"
                      min={0}
                      value={sc.cap}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSprintCaps((prev) => prev.map((x) => (x.nr === sc.nr ? { ...x, cap: v } : x)));
                      }}
                      disabled={autoBudgetFromFte}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setSprintCaps((prev) => prev.filter((x) => x.nr !== sc.nr))}
                      disabled={autoBudgetFromFte}
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </aside>
  );
}
