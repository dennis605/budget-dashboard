import { useMemo } from "react";
import type { Dispatch, JSX, SetStateAction } from "react";
import type { Task } from "../types";

interface TaskTableProps {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
}

export default function TaskTable({ tasks, setTasks }: TaskTableProps): JSX.Element {
  const totals = useMemo(() => {
    const totalHours = tasks.reduce((sum, t) => sum + (Number.isFinite(t.hours) ? t.hours : 0), 0);
    const sprints = new Set(tasks.map((t) => t.sprintNr)).size;
    return { totalHours, sprints };
  }, [tasks]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-semibold text-slate-900">Tasks</h2>
          <div className="text-xs text-slate-500 mt-1">
            {tasks.length} Einträge · {totals.totalHours.toFixed(1)} h · {totals.sprints} Sprint(s)
          </div>
        </div>

        <button
          className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
          onClick={() => {
            const id = `t${Math.random().toString(16).slice(2)}`;
            setTasks((prev) => [...prev, { id, name: "Neuer Task", sprintNr: 1, hours: 8 }]);
          }}
          type="button"
        >
          + Task hinzufügen
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
          Noch keine Tasks vorhanden. Füge den ersten Task hinzu, um die Planung zu starten.
        </div>
      ) : (
        <div className="overflow-auto mt-3">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="text-left text-slate-600 border-b bg-slate-50">
                <th className="py-2 pr-3 pl-2">Task</th>
                <th className="py-2 pr-3">Sprint</th>
                <th className="py-2 pr-3">Stunden</th>
                <th className="py-2 pr-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 pl-2">
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={t.name}
                      onChange={(e) =>
                        setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="py-2 pr-3 w-36">
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      type="number"
                      min={1}
                      value={t.sprintNr}
                      onChange={(e) =>
                        setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, sprintNr: Number(e.target.value) } : x)))
                      }
                    />
                  </td>
                  <td className="py-2 pr-3 w-40">
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      type="number"
                      min={0}
                      step={0.5}
                      value={t.hours}
                      onChange={(e) =>
                        setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, hours: Number(e.target.value) } : x)))
                      }
                    />
                  </td>
                  <td className="py-2 pr-3 w-36">
                    <button
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                      type="button"
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-600">
        Stunden werden gleichmäßig auf Arbeitstage des zugewiesenen Sprints verteilt.
      </div>
    </section>
  );
}
