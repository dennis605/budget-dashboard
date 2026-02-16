import { useMemo } from "react";
import type { Dispatch, JSX, SetStateAction } from "react";
import type { BarData, CardInfo, DailyRow, ParsedDates, Status, ViewMode } from "../types";
import DayCell from "./DayCell";
import BarRow from "./BarRow";
import { fmtDE, parseISODate, toISODate } from "../utils/dateUtils";

interface CalendarPanelProps {
  viewMode: ViewMode;
  parsed: ParsedDates;
  monthlyCap: number;
  cal: {
    month: Date;
    monthPlanned: number;
    cells: {
      d: Date;
      planned: number;
      rM: number;
      rS: number;
      rT: number;
      monthCap: number;
      status: Status;
      inProject: boolean;
      sprintNr: number | null;
      capThisSprint: number | null;
      sprintStart: boolean;
      statusReason: "ok" | "sprint" | "month" | "total";
      statusLabel: string;
      sprintDay: number | null;
      sprintTotalDays: number | null;
      avg: number | undefined;
    }[];
  };
  timeline: {
    weeks: {
      week: CalendarPanelProps["cal"]["cells"];
      monthLabel: string | null;
    }[];
  };
  barData: BarData;
  badge: (status: Status) => string;
  cardInfo: CardInfo;
  selectedDateISO: string | null;
  setSelectedDateISO: Dispatch<SetStateAction<string | null>>;
  dailyRows: DailyRow[];
}

export default function CalendarPanel({
  viewMode,
  parsed,
  monthlyCap,
  cal,
  timeline,
  barData,
  badge,
  cardInfo,
  selectedDateISO,
  setSelectedDateISO,
  dailyRows,
}: CalendarPanelProps): JSX.Element {
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
  }, [dailyRows, selectedDateISO]);

  return (
    <div className="rounded-2xl border border-slate-200 p-4 shadow-sm lg:col-span-2">
      {viewMode === "month" ? (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold">Kalender: {cal.month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</h2>
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
              Projekt: {fmtDE(parsed.start)} - {fmtDE(parsed.end)}
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
              Projekt: {fmtDE(parsed.start)} - {fmtDE(parsed.end)}
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
          <h3 className="font-semibold text-sm">Details zum ausgewählten Tag</h3>
          {selectedDayInfo?.selectedDate && <div className="text-xs text-slate-600">{fmtDE(selectedDayInfo.selectedDate)}</div>}
        </div>

        {!selectedDayInfo ? (
          <div className="text-sm text-slate-500 mt-2">Bitte einen Tag anklicken.</div>
        ) : !selectedDayInfo.inProject ? (
          <div className="text-sm text-slate-500 mt-2">Der ausgewählte Tag liegt außerhalb des Projektzeitraums.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3 text-sm">
            <div className="rounded-lg border border-slate-200 p-2">
              <div className="text-slate-600">Budget übrig (Monat)</div>
              <div className="font-semibold">{selectedDayInfo.remainingMonthBudget?.toFixed(1)}h</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2">
              <div className="text-slate-600">Budget übrig (Projektzeitraum)</div>
              <div className="font-semibold">{selectedDayInfo.remainingProjectBudget?.toFixed(1)}h</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2">
              <div className="text-slate-600">Zusätzliches Budget nötig (Monat)</div>
              <div className="font-semibold">{selectedDayInfo.additionalMonthBudgetNeeded?.toFixed(1)}h</div>
              <div className="text-xs mt-1 text-slate-600">Restaufwand Monat: {selectedDayInfo.remainingMonthEffort?.toFixed(1)}h</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2">
              <div className="text-slate-600">
                Offener Task-Aufwand
                {selectedDayInfo.sprintNr ? ` (Sprint ${selectedDayInfo.sprintNr})` : ""}
              </div>
              <div className="font-semibold">{selectedDayInfo.openTaskEffort?.toFixed(1)}h</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2">
              <div className="text-slate-600">
                Nötiges Budget
                {selectedDayInfo.sprintNr ? ` (bis Ende Sprint ${selectedDayInfo.sprintNr})` : ""}
              </div>
              <div className="font-semibold">{selectedDayInfo.neededBudget?.toFixed(1)}h</div>
              <div className={`text-xs mt-1 ${(selectedDayInfo.budgetGap ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {(selectedDayInfo.budgetGap ?? 0) >= 0
                  ? `Puffer: ${(selectedDayInfo.budgetGap ?? 0).toFixed(1)}h`
                  : `Fehlend: ${Math.abs(selectedDayInfo.budgetGap ?? 0).toFixed(1)}h`}
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
  );
}
