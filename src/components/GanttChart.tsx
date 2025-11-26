import React, { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { Task } from "../App";

type ViewMode = "days" | "weeks" | "months";

interface TimeUnit {
  date: Date;
  label: string;
  subLabel?: string;
}

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("days");

  // Normalizar tareas
  const normalizedTasks = useMemo(
    () =>
      tasks.map((t) => ({
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      })),
    [tasks]
  );

  // ===== GENERACIÓN TOTALMENTE NUEVA DE MIN/MAX =====
  const { timeUnits, minDate, maxDate } = useMemo(() => {
    if (normalizedTasks.length === 0) {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return generateUnits(start, end, viewMode);
    }

    const all = normalizedTasks.flatMap((t) => [t.startDate, t.endDate]);
    let min = new Date(Math.min(...all.map((d) => d.getTime())));
    let max = new Date(Math.max(...all.map((d) => d.getTime())));

    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);

    // Extensión según vista
    if (viewMode === "days") {
      min.setDate(min.getDate() - 3);
      max.setDate(max.getDate() + 15);
    } else if (viewMode === "weeks") {
      min.setDate(min.getDate() - 14);
      max.setDate(max.getDate() + 60);
    } else {
      min.setMonth(min.getMonth() - 1);
      max.setMonth(max.getMonth() + 6);
    }

    // Máximo dinámico = junio del próximo año
    const now = new Date();
    const hardMax = new Date(now.getFullYear() + 1, 5, 30);
    if (max > hardMax) max = hardMax;

    return generateUnits(min, max, viewMode);
  }, [normalizedTasks, viewMode]);

  // ====================================================
  //      GENERADOR DE UNIDADES — 100% A PRUEBA DE DST
  // ====================================================
  function generateUnits(start: Date, end: Date, mode: ViewMode) {
    const units: TimeUnit[] = [];

    const min = new Date(start);
    const max = new Date(end);

    if (mode === "days") {
      const d = new Date(min);
      while (d <= max) {
        units.push({
          date: new Date(d),
          label: d.toLocaleDateString("es-ES", { weekday: "short" }),
          subLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        });
        d.setDate(d.getDate() + 1);
      }
    }

    else if (mode === "weeks") {
      const d = new Date(min);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // ir a lunes

      while (d <= max) {
        const startW = new Date(d);
        const endW = new Date(d);
        endW.setDate(endW.getDate() + 6);

        units.push({
          date: new Date(startW),
          label: `Semana ${getWeekNumber(startW)}`,
          subLabel: `${startW.getDate()}/${startW.getMonth() + 1} - ${endW.getDate()}/${endW.getMonth() + 1}`,
        });

        d.setDate(d.getDate() + 7);
      }
    }

    else {
      const d = new Date(min.getFullYear(), min.getMonth(), 1);
      while (d <= max) {
        units.push({
          date: new Date(d),
          label: d.toLocaleDateString("es-ES", { month: "short" }),
          subLabel: d.getFullYear().toString(),
        });
        d.setMonth(d.getMonth() + 1);
      }
    }

    return { timeUnits: units, minDate: min, maxDate: max };
  }

  function getWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((d.getTime() - yearStart.getTime()) / 86400000 / 7) + 1;
  }

  // ====================================================
  //           POSICIÓN DE TAREAS BASADA EN ÍNDICES
  // ====================================================
  const getTaskPosition = (task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const startIndex = timeUnits.findIndex((u) => u.date >= start);
    let endIndex = timeUnits.findIndex((u) => u.date >= end);

    if (endIndex === -1) endIndex = timeUnits.length - 1;

    const duration = Math.max(endIndex - startIndex + 1, 1);

    return {
      left: `${(startIndex / timeUnits.length) * 100}%`,
      width: `${(duration / timeUnits.length) * 100}%`,
    };
  };

  // ====================================================
  //                     HOY
  // ====================================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIndex = timeUnits.findIndex((u) => u.date.getTime() === today.getTime());
  const todayPos = todayIndex >= 0 ? (todayIndex / timeUnits.length) * 100 : -1;

  // ====================================================
  //                  ORDENAR TAREAS
  // ====================================================
  const organizedTasks = useMemo(() => {
    const out: Task[] = [];
    const rec = (t: Task) => {
      out.push(t);
      normalizedTasks.filter((s) => s.parentId === t.id).forEach(rec);
    };
    normalizedTasks.filter((t) => !t.parentId).forEach(rec);
    return out;
  }, [normalizedTasks]);

  // ====================================================
  //                     RENDER
  // ====================================================
  return (
    <div>
      {/* CONTROLES */}
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">Vista:</span>

        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          {(["days", "weeks", "months"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === mode ? "bg-white shadow-sm" : "text-gray-600"
              }`}
            >
              {mode === "days" && "Días"}
              {mode === "weeks" && "Semanas"}
              {mode === "months" && "Meses"}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLL */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${timeUnits.length * 50}px` }}>
          {/* HEADER */}
          <div className="flex border-b border-gray-200">
            <div className="w-48 bg-gray-50 px-4 py-2 shrink-0"></div>

            <div className="relative flex">
              {todayPos !== -1 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${todayPos}%` }}
                />
              )}

              {timeUnits.map((u, i) => (
                <div
                  key={i}
                  className="border-l border-gray-200 text-center text-xs py-2"
                  style={{ width: 50 }}
                >
                  <div>{u.label}</div>
                  <div className="text-[10px] text-gray-500">{u.subLabel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FILAS */}
          {organizedTasks.map((t) => {
            const pos = getTaskPosition(t);
            const isSub = !!t.parentId;

            return (
              <div key={t.id} className="flex border-b border-gray-200">
                <div className="w-48 px-4 py-3 shrink-0">
                  <span className={isSub ? "ml-6 text-gray-600" : ""}>
                    {isSub && "└ "}
                    {t.name}
                  </span>
                </div>

                <div className="relative flex">
                  {timeUnits.map((_, i) => (
                    <div
                      key={i}
                      style={{ width: 50 }}
                      className="border-l border-gray-200"
                    />
                  ))}

                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-8 rounded text-xs text-white flex items-center px-2 shadow-sm"
                    style={{
                      ...pos,
                      backgroundColor: t.color,
                      opacity: isSub ? 0.85 : 1,
                    }}
                  >
                    {t.name}
                  </div>
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No hay tareas todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
