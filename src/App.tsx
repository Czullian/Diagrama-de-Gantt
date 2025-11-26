import React, { useState, useEffect, useRef } from 'react';
import { GanttChart } from './components/GanttChart';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { Plus, Save, RotateCcw } from 'lucide-react';

export interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  parentId?: string;
  color: string;
}

function App() {

  // ---------------------------------
  // 1. CARGA SEGURA DESDE LOCALSTORAGE
  // ---------------------------------
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem("gantt-tasks");

      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((t: any) => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate)
        }));
      }
    } catch (e) {
      console.error("Error loading local data:", e);
    }

    // Si no hay nada -> empezar vacío
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // ---------------------------------
  // 2. EVITAR GUARDADO AUTOMÁTICO EN PRIMER RENDER
  // ---------------------------------
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    localStorage.setItem("gantt-tasks", JSON.stringify(tasks));
  }, [tasks]);

  // ---------------------------------
  // 3. BOTÓN GUARDAR MANUAL
  // ---------------------------------
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    try {
      localStorage.setItem("gantt-tasks", JSON.stringify(tasks));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving tasks:", error);
      alert("Error al guardar los cambios");
    }
  };

  // ---------------------------------
  // 4. RESETEAR A VACÍO
  // ---------------------------------
  const handleReset = () => {
    if (confirm("¿Quieres borrar todas las tareas?")) {
      setTasks([]);
      localStorage.setItem("gantt-tasks", JSON.stringify([]));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // ---------------------------------
  // 5. CRUD
  // ---------------------------------
  const handleAddTask = (task: Omit<Task, "id">) => {
    const newTask = {
      ...task,
      id: Date.now().toString()
    };
    setTasks([...tasks, newTask]);
    setShowForm(false);
  };

  const handleEditTask = (task: Task) => {
    setTasks(tasks.map(t => t.id === task.id ? task : t));
    setEditingTask(null);
    setShowForm(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const toDelete = new Set([taskId]);

    const findChildren = (id: string) => {
      tasks.forEach(t => {
        if (t.parentId === id) {
          toDelete.add(t.id);
          findChildren(t.id);
        }
      });
    };

    findChildren(taskId);
    setTasks(tasks.filter(t => !toDelete.has(t.id)));
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  // ---------------------------------
  // 6. UI
  // ---------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">

        <div className="mb-6">
          <h1 className="text-gray-900 mb-2">Diagrama de Gantt</h1>
          <p className="text-gray-600">
            Gestiona tus tareas y subtareas con línea de tiempo visual
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Propiedad de: Cinzia Zullian
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-900">Tareas</h2>

                <button
                  onClick={handleNewTask}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Tarea
                </button>
              </div>

              <TaskList
                tasks={tasks}
                onEdit={handleEditClick}
                onDelete={handleDeleteTask}
              />
            </div>

            {showForm && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-gray-900 mb-4">
                  {editingTask ? "Editar Tarea" : "Nueva Tarea"}
                </h2>
                <TaskForm
                  tasks={tasks}
                  onSubmit={editingTask ? handleEditTask : handleAddTask}
                  onCancel={handleCancelForm}
                  editingTask={editingTask}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-gray-900 mb-4">Línea de Tiempo</h2>
              <GanttChart tasks={tasks} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Borrar Todo
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>

          {saved && (
            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              ✓ Cambios guardados
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;