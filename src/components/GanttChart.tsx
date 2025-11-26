import React, { useMemo, useState } from 'react';
import { Task } from '../App';
import { Calendar, ChevronDown } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
}

type ViewMode = 'days' | 'weeks' | 'months';

interface TimeUnit {
  label: string;
  subLabel?: string;
  date: Date;
}

export function GanttChart({ tasks }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('days');

  const { timeUnits, minDate, maxDate } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      
      return generateTimeUnits(start, end, viewMode);
    }

    const allDates = tasks.flatMap(t => [t.startDate, t.endDate]);
    const min = new Date(Math.min(...allDates.map(d => d.getTime())));
    const max = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Agregar un margen según el modo de vista
    if (viewMode === 'months') {
      min.setMonth(min.getMonth() - 1);
      max.setMonth(max.getMonth() + 1);
    } else if (viewMode === 'weeks') {
      min.setDate(min.getDate() - 7);
      max.setDate(max.getDate() + 7);
    } else {
      min.setDate(min.getDate() - 2);
      max.setDate(max.getDate() + 2);
    }
    
    return generateTimeUnits(min, max, viewMode);
  }, [tasks, viewMode]);

  function generateTimeUnits(start: Date, end: Date, mode: ViewMode) {
    const units: TimeUnit[] = [];
    const minDate = new Date(start);
    minDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(end);
    maxDate.setHours(0, 0, 0, 0);

    if (mode === 'days') {
      for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        units.push({
          label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
          subLabel: `${d.getDate()}/${d.getMonth() + 1}`,
          date: new Date(d)
        });
      }
    } else if (mode === 'weeks') {
      // Empezar desde el lunes de la semana que contiene minDate
      const current = new Date(minDate);
      const day = current.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Ajustar al lunes
      current.setDate(current.getDate() + diff);

      while (current <= maxDate) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        units.push({
          label: `Semana ${getWeekNumber(current)}`,
          subLabel: `${current.getDate()}/${current.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
          date: new Date(current)
        });
        
        current.setDate(current.getDate() + 7);
      }
    } else if (mode === 'months') {
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      
      while (current <= maxDate) {
        units.push({
          label: current.toLocaleDateString('es-ES', { month: 'short' }),
          subLabel: current.getFullYear().toString(),
          date: new Date(current)
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    }

    return { timeUnits: units, minDate, maxDate };
  }

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    taskStart.setHours(0, 0, 0, 0);
    const taskEnd = new Date(task.endDate);
    taskEnd.setHours(0, 0, 0, 0);
    
    let totalDuration: number;
    let startOffset: number;
    let taskDuration: number;

    if (viewMode === 'days') {
      totalDuration = Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      startOffset = Math.floor((taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      taskDuration = Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else if (viewMode === 'weeks') {
      totalDuration = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      startOffset = (taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
      taskDuration = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24 * 7) + 0.15;
    } else {
      // months
      totalDuration = timeUnits.length;
      const startMonthIndex = timeUnits.findIndex(unit => {
        return unit.date.getMonth() === taskStart.getMonth() && 
               unit.date.getFullYear() === taskStart.getFullYear();
      });
      const endMonthIndex = timeUnits.findIndex(unit => {
        return unit.date.getMonth() === taskEnd.getMonth() && 
               unit.date.getFullYear() === taskEnd.getFullYear();
      });
      
      startOffset = startMonthIndex >= 0 ? startMonthIndex : 0;
      taskDuration = endMonthIndex >= startOffset ? endMonthIndex - startOffset + 1 : 1;
    }
    
    const left = (startOffset / totalDuration) * 100;
    const width = (taskDuration / totalDuration) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  const getTodayPosition = () => {
    if (viewMode === 'days') {
      const totalDays = timeUnits.length;
      // Encontrar el índice del día actual en timeUnits comparando día, mes y año
      const todayIndex = timeUnits.findIndex(unit => {
        return unit.date.getDate() === today.getDate() &&
               unit.date.getMonth() === today.getMonth() &&
               unit.date.getFullYear() === today.getFullYear();
      });
      if (todayIndex < 0) return -1;
      // Centrar el indicador en el día sumando 0.5
      // Calculamos el porcentaje dentro del área flex-1 del Gantt
      const ganttAreaPercent = ((todayIndex + 0.5) / totalDays) * 100;
      return ganttAreaPercent;
    } else if (viewMode === 'weeks') {
      const totalDuration = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const todayOffset = (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
      const ganttAreaPercent = (todayOffset / totalDuration) * 100;
      return ganttAreaPercent;
    } else {
      // months
      const todayMonthIndex = timeUnits.findIndex(unit => {
        return unit.date.getMonth() === today.getMonth() && 
               unit.date.getFullYear() === today.getFullYear();
      });
      if (todayMonthIndex < 0) return -1;
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const dayOfMonth = today.getDate();
      const positionInMonth = dayOfMonth / daysInMonth;
      
      const ganttAreaPercent = ((todayMonthIndex + positionInMonth) / timeUnits.length) * 100;
      return ganttAreaPercent;
    }
  };

  const isToday = (date: Date) => {
    if (viewMode !== 'days') return false;
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isWeekend = (date: Date) => {
    if (viewMode !== 'days') return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Organizar tareas por jerarquía
  const organizedTasks = useMemo(() => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const result: Task[] = [];
    
    const addTaskAndChildren = (task: Task) => {
      result.push(task);
      const children = tasks.filter(t => t.parentId === task.id);
      children.forEach(child => addTaskAndChildren(child));
    };
    
    tasks.filter(t => !t.parentId).forEach(addTaskAndChildren);
    
    return result;
  }, [tasks]);

  const todayPosition = getTodayPosition();
  const isTodayVisible = todayPosition >= 0 && todayPosition <= 100;

  return (
    <div>
      {/* Controles de vista */}
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">Vista:</span>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('days')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'days'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Días
          </button>
          <button
            onClick={() => setViewMode('weeks')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'weeks'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semanas
          </button>
          <button
            onClick={() => setViewMode('months')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'months'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Meses
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Encabezado de fechas */}
          <div className="flex border-b border-gray-200">
            <div className="w-48 flex-shrink-0 px-4 py-2 bg-gray-50"></div>
            <div className="flex-1 flex relative">
              {/* Línea de hoy en el encabezado */}
              {isTodayVisible && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{ left: `${todayPosition}%` }}
                ></div>
              )}
              {timeUnits.map((unit, index) => (
                <div
                  key={index}
                  className={`flex-1 text-center px-1 py-2 text-xs border-l border-gray-200 ${
                    isToday(unit.date) ? 'bg-blue-50 font-semibold text-blue-600' : 'bg-gray-50'
                  } ${isWeekend(unit.date) ? 'bg-gray-100' : ''}`}
                >
                  <div>{unit.label}</div>
                  {unit.subLabel && <div className="text-[10px] text-gray-500">{unit.subLabel}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Tareas */}
          <div className="flex">
            <div className="w-48 flex-shrink-0"></div>
            <div className="flex-1 relative">
              {/* Línea de hoy */}
              {isTodayVisible && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{ left: `${todayPosition}%` }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                  <div className="absolute top-2 -left-8 text-xs text-red-500 whitespace-nowrap">
                    Hoy
                  </div>
                </div>
              )}

              <div>
                {organizedTasks.map((task) => {
                  const isSubtask = !!task.parentId;
                  const position = getTaskPosition(task);
                  
                  return (
                    <div key={task.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                      <div className="w-48 flex-shrink-0 px-4 py-3 flex items-center absolute left-0">
                        <span className={`text-sm text-gray-700 ${isSubtask ? 'ml-6 text-gray-600' : ''}`}>
                          {isSubtask && '└ '}
                          {task.name}
                        </span>
                      </div>
                      <div className="w-full relative">
                        <div className="flex h-full">
                          {timeUnits.map((unit, index) => (
                            <div
                              key={index}
                              className={`flex-1 border-l border-gray-200 ${
                                isWeekend(unit.date) ? 'bg-gray-50' : ''
                              }`}
                            ></div>
                          ))}
                        </div>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-8 rounded flex items-center px-2 text-white text-xs shadow-sm"
                          style={{
                            ...position,
                            backgroundColor: task.color,
                            opacity: isSubtask ? 0.8 : 1
                          }}
                        >
                          <span className="truncate">{task.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay tareas. Añade una tarea para comenzar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}