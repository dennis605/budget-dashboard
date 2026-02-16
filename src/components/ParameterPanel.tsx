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
  monthlyCap: number;
  setMonthlyCap: Dispatch<SetStateAction<number>>;
  sprintCapDefault: number;
  setSprintCapDefault: Dispatch<SetStateAction<number>>;
  sprintCaps: SprintCap[];
  setSprintCaps: Dispatch<SetStateAction<SprintCap[]>>;
  monthShown: string;
  setMonthShown: Dispatch<SetStateAction<string>>;
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
  monthlyCap,
  setMonthlyCap,
  sprintCapDefault,
  setSprintCapDefault,
  sprintCaps,
  setSprintCaps,
  monthShown,
  setMonthShown,
  showAdvanced,
  setShowAdvanced,
  cardInfo,
  setCardInfo,
  totalPlanned,
}: ParameterPanelProps): JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
      <h2 className="font-semibold">Parameter</h2>

      <div className="mt-3">
        <div className="text-sm text-slate-600">Ansicht</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-sm border ${
              viewMode === "month" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
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
              viewMode === "bars" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => setViewMode("bars")}
          >
            Balkendiagramm
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Monat = klassischer Monatskalender - Timeline = fortlaufende Wochen - Balkendiagramm = aggregierte
          Auswertung.
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
          <span className="font-semibold">{totalPlanned.toFixed(1)} h</span>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-4 rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Sprint-Caps</h2>
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
              onClick={() => {
                const nextNr = sprintCaps.length ? Math.max(...sprintCaps.map((s) => s.nr)) + 1 : 1;
                setSprintCaps((prev) => [...prev, { nr: nextNr, cap: sprintCapDefault }]);
              }}
            >
              + Sprint-Cap
            </button>
          </div>
          <div className="text-xs text-slate-600 mt-1">Setze hier die Max-Stunden pro Sprint.</div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {sprintCaps
              .slice()
              .sort((a, b) => a.nr - b.nr)
              .map((sc) => (
                <label key={sc.nr} className="text-sm">
                  <div className="text-slate-600">Sprint {sc.nr} (h)</div>
                  <div className="mt-1 flex gap-2">
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      type="number"
                      min={0}
                      value={sc.cap}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSprintCaps((prev) => prev.map((x) => (x.nr === sc.nr ? { ...x, cap: v } : x)));
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50"
                      onClick={() => setSprintCaps((prev) => prev.filter((x) => x.nr !== sc.nr))}
                    >
                      Entfernen
                    </button>
                  </div>
                </label>
              ))}
          </div>

          <div className="text-xs text-slate-500 mt-3">Hinweis: Nicht konfigurierte Sprints nutzen den Default.</div>
        </div>
      )}
    </div>
  );
}
