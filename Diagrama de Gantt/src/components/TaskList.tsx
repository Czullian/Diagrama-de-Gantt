import React from "react";
import { Task } from "../App";
import { Edit2, Trash2, Calendar } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
}: TaskListProps) {
  // Organizar tareas por jerarquía
  const organizedTasks: Task[] = [];

  const addTaskAndChildren = (task: Task) => {
    organizedTasks.push(task);
    const children = tasks.filter(
      (t) => t.parentId === task.id,
    );
    children.forEach((child) => addTaskAndChildren(child));
  };

  tasks.filter((t) => !t.parentId).forEach(addTaskAndChildren);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const getDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? "1 día" : `${days} días`;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay tareas todavía
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {organizedTasks.map((task) => {
        const isSubtask = !!task.parentId;
        const hasChildren = tasks.some(
          (t) => t.parentId === task.id,
        );

        return (
          <div
            key={task.id}
            className={`p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${
              isSubtask ? "ml-6 bg-gray-50" : "bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.color }}
                  />
                  <h3 className="text-sm text-gray-900 truncate">
                    {isSubtask && "└ "}
                    {task.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(task.startDate)} -{" "}
                    {formatDate(task.endDate)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>
                    {getDuration(task.startDate, task.endDate)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      if (
                        confirm(
                          "Esta tarea tiene subtareas. ¿Deseas eliminarla junto con sus subtareas?",
                        )
                      ) {
                        onDelete(task.id);
                      }
                    } else {
                      onDelete(task.id);
                    }
                  }}
                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}