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
  monthShown: string;
  setMonthShown: Dispatch<SetStateAction<string>>;
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
  monthShown,
  setMonthShown,
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

  const monthNavigation = useMemo(() => {
    const base = parseISODate(monthShown);
    const current = new Date(base.getFullYear(), base.getMonth(), 1);
    const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      prevISO: toISODate(prev),
      nextISO: toISODate(next),
      thisISO: toISODate(thisMonth),
    };
  }, [monthShown]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      {viewMode === "month" ? (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900">
                Monatsansicht: {cal.month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Klicke einen Tag an, um die Detailrechnung darunter zu sehen.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => setMonthShown(monthNavigation.prevISO)}
              >
                ◀
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => setMonthShown(monthNavigation.thisISO)}
              >
                Heute
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => setMonthShown(monthNavigation.nextISO)}
              >
                ▶
              </button>
              <input
                className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm"
                type="date"
                value={monthShown}
                onChange={(e) => setMonthShown(e.target.value)}
                title="Monat anzeigen"
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Monat geplant: <span className="font-semibold">{cal.monthPlanned.toFixed(1)} h</span> / {monthlyCap} h
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-3 text-xs text-slate-600">
            {[
              { k: "Mo", v: "Mo" },
              { k: "Di", v: "Di" },
              { k: "Mi", v: "Mi" },
              { k: "Do", v: "Do" },
              { k: "Fr", v: "Fr" },
              { k: "Sa", v: "Sa" },
              { k: "So", v: "So" },
            ].map((d) => (
              <div key={d.k} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-center font-medium">
                {d.v}
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
            <div>
              <h2 className="font-semibold text-slate-900">Timeline (fortlaufende Wochen)</h2>
              <p className="text-xs text-slate-500 mt-1">Ideal für längere Projekte und Sprintwechsel über Monatsgrenzen.</p>
            </div>
            <div className="text-sm text-slate-600">
              {fmtDE(parsed.start)} - {fmtDE(parsed.end)}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-3 text-xs text-slate-600">
            {[
              { k: "Mo", v: "Mo" },
              { k: "Di", v: "Di" },
              { k: "Mi", v: "Mi" },
              { k: "Do", v: "Do" },
              { k: "Fr", v: "Fr" },
              { k: "Sa", v: "Sa" },
              { k: "So", v: "So" },
            ].map((d) => (
              <div key={d.k} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-center font-medium">
                {d.v}
              </div>
            ))}
          </div>

          <div className="mt-2 max-h-[560px] overflow-y-auto pr-1">
            <div className="space-y-3">
              {timeline.weeks.map((w, wi) => (
                <div key={wi}>
                  {w.monthLabel && (
                    <div className="sticky top-0 z-10 pb-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white shadow-sm text-xs font-medium text-slate-700">
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
            <div>
              <h2 className="font-semibold text-slate-900">Balkenansicht (Aggregation)</h2>
              <p className="text-xs text-slate-500 mt-1">Vergleicht geplante Stunden direkt mit Gesamt-, Monats- und Sprint-Caps.</p>
            </div>
            <div className="text-sm text-slate-600">
              {fmtDE(parsed.start)} - {fmtDE(parsed.end)}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="text-sm font-semibold mb-2">Gesamtbudget</div>
              <BarRow label="Gesamt" planned={barData.total.planned} cap={barData.total.cap} />
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="text-sm font-semibold mb-2">Monate</div>
              <div className="space-y-3">
                {barData.months.map((m) => (
                  <BarRow key={m.key} label={m.label} planned={m.planned} cap={m.cap} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
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

      <div className="mt-4 rounded-2xl border border-slate-200 p-3 bg-slate-50">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-slate-900">Tagesdetails</h3>
          {selectedDayInfo?.selectedDate && <div className="text-xs text-slate-600">{fmtDE(selectedDayInfo.selectedDate)}</div>}
        </div>

        {!selectedDayInfo ? (
          <div className="text-sm text-slate-500 mt-2">Noch kein Tag ausgewählt. Klicke in der Ansicht auf ein Datum.</div>
        ) : !selectedDayInfo.inProject ? (
          <div className="text-sm text-slate-500 mt-2">Der ausgewählte Tag liegt außerhalb des Projektzeitraums.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mt-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-slate-500 text-xs uppercase">Rest Monat</div>
              <div className="font-semibold text-base">{selectedDayInfo.remainingMonthBudget?.toFixed(1)}h</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-slate-500 text-xs uppercase">Rest Gesamt</div>
              <div className="font-semibold text-base">{selectedDayInfo.remainingProjectBudget?.toFixed(1)}h</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-slate-500 text-xs uppercase">Zusätzlich nötig</div>
              <div className="font-semibold text-base">{selectedDayInfo.additionalMonthBudgetNeeded?.toFixed(1)}h</div>
              <div className="text-xs mt-1 text-slate-500">Restaufwand Monat: {selectedDayInfo.remainingMonthEffort?.toFixed(1)}h</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-slate-500 text-xs uppercase">Offener Task-Aufwand</div>
              <div className="font-semibold text-base">{selectedDayInfo.openTaskEffort?.toFixed(1)}h</div>
              {selectedDayInfo.sprintNr ? <div className="text-xs mt-1 text-slate-500">Sprint {selectedDayInfo.sprintNr}</div> : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-slate-500 text-xs uppercase">Nötiges Budget</div>
              <div className="font-semibold text-base">{selectedDayInfo.neededBudget?.toFixed(1)}h</div>
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
        <span className={`px-2 py-1 rounded-full ${badge("bad")}`}>Rot: Cap überschritten</span>
        <span className="px-2 py-1 rounded-full border border-slate-300">Blaue Linie: Sprintwechsel</span>
        <span className="px-2 py-1 rounded-full border border-slate-300">Gelbe Markierung: Monatsanfang</span>
      </div>
    </section>
  );
}
