import type { JSX } from "react";

interface BarRowProps {
  label: string;
  planned: number;
  cap: number;
}

export default function BarRow({ label, planned, cap }: BarRowProps): JSX.Element {
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
