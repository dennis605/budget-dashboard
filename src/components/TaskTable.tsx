import type { Dispatch, JSX, SetStateAction } from "react";
import type { Task } from "../types";

interface TaskTableProps {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
}

export default function TaskTable({ tasks, setTasks }: TaskTableProps): JSX.Element {
  return (
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
                      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))
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
                      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, sprintNr: Number(e.target.value) } : x)))
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
                      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, hours: Number(e.target.value) } : x)))
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
        Logik: Task-Stunden werden gleichmäßig auf Arbeitstage des zugewiesenen Sprints verteilt, damit Monatsgrenzen
        sauber berücksichtigt werden.
      </div>
    </div>
  );
}
