import { memo } from "react";
import type { JSX } from "react";
import type { CalendarCell, CardInfo, Status } from "../types";
import { toISODate } from "../utils/dateUtils";
import { sprintTintClass } from "../utils/budgetUtils";

interface DayCellProps {
  c: CalendarCell;
  badge: (status: Status) => string;
  cardInfo: CardInfo;
  isSelected: boolean;
  onSelect: (dateIso: string) => void;
}

function DayCellComponent({ c, badge, cardInfo, isSelected, onSelect }: DayCellProps): JSX.Element {
  const isMonthStart = c.d.getDate() === 1;
  const monthRestPct =
    typeof c.monthCap === "number" && c.monthCap > 0 ? Math.max(0, Math.min(100, (c.rM / c.monthCap) * 100)) : null;
  const monthBarClass = c.rM < 0 ? "bg-rose-500" : c.rM <= c.monthCap * 0.3 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div
      className={`relative border rounded-2xl p-2.5 min-h-[96px] transition hover:shadow-sm ${badge(c.status)} ${sprintTintClass(
        c.sprintNr
      )} ${c.inProject ? "" : "opacity-50"} ${c.status === "bad" ? "ring-2 ring-rose-500 border-rose-500" : ""} ${
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
          ? `Sprint ${c.sprintNr} | ${c.statusLabel} | Geplant: ${c.planned.toFixed(1)}h | Restsprint Aufwand: ${
              c.rS
            .toFixed(1)}h | Rest Monat: ${c.rM.toFixed(1)}h | Rest Gesamt: ${c.rT.toFixed(1)}h`
          : `Kein Sprint aktiv | Geplant: ${c.planned.toFixed(1)}h | Rest Monat: ${c.rM.toFixed(
              1
            )}h | Rest Gesamt: ${c.rT.toFixed(1)}h`
      }
    >
      {c.sprintStart && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />}

      {isMonthStart && (
        <div className="absolute right-1 top-1 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
          Monat
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900 leading-tight">{c.d.getDate()}</div>
          <div className="text-[10px] text-slate-500">{c.d.toLocaleDateString("de-DE", { weekday: "short" })}</div>
          {c.sprintNr ? (
            <div className="text-[10px] text-slate-700">Sprint {c.sprintNr}</div>
          ) : (
            <div className="text-[10px] text-slate-500">Außerhalb Sprint</div>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            c.status === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }`}
        >
          {c.status === "ok" ? "OK" : "Cap"}
        </span>
      </div>

      {cardInfo.plannedToday && <div className="mt-2 text-xs font-medium text-slate-900">{c.planned.toFixed(1)}h geplant</div>}

      {cardInfo.restSprint && c.sprintNr && <div className="mt-1 text-[11px] text-slate-700">Sprint-Rest: {c.rS.toFixed(1)}h</div>}

      {cardInfo.restMonth && (
        <div className="mt-1">
          <div className="text-[11px] text-slate-700">Monat-Rest: {c.rM.toFixed(1)}h</div>
          {typeof monthRestPct === "number" && (
            <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full ${monthBarClass}`} style={{ width: `${monthRestPct}%` }} />
            </div>
          )}
        </div>
      )}

      {cardInfo.restTotal && <div className="mt-1 text-[11px] text-slate-700">Gesamt-Rest: {c.rT.toFixed(1)}h</div>}

      {cardInfo.sprintAvg && typeof c.avg === "number" && Number.isFinite(c.avg) && (
        <div className="mt-1 text-[10px] text-slate-500">Ø Sprint: {c.avg.toFixed(1)}h/AT</div>
      )}
    </div>
  );
}

const DayCell = memo(DayCellComponent);

export default DayCell;
