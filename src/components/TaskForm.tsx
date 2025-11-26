import React, { useState, useEffect } from 'react';
import { Task } from '../App';

interface TaskFormProps {
  tasks: Task[];
  onSubmit: (task: Task | Omit<Task, 'id'>) => void;
  onCancel: () => void;
  editingTask?: Task | null;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function TaskForm({ tasks, onSubmit, onCancel, editingTask }: TaskFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setStartDate(formatDateForInput(editingTask.startDate));
      setEndDate(formatDateForInput(editingTask.endDate));
      setParentId(editingTask.parentId || '');
      setColor(editingTask.color);
    } else {
      // Limpiar el formulario cuando no hay tarea en edición
      setName('');
      setParentId('');
      setColor(COLORS[0]);
      // Establecer fechas por defecto
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(formatDateForInput(today));
      setEndDate(formatDateForInput(tomorrow));
    }
  }, [editingTask]);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      parentId: parentId || undefined,
      color: parentId ? getParentColor(parentId) : color
    };

    if (editingTask) {
      onSubmit({ ...taskData, id: editingTask.id });
    } else {
      onSubmit(taskData);
    }

    // Reset form
    setName('');
    setStartDate('');
    setEndDate('');
    setParentId('');
    setColor(COLORS[0]);
  };

  const getParentColor = (parentTaskId: string) => {
    const parent = tasks.find(t => t.id === parentTaskId);
    if (!parent) return COLORS[0];
    
    // Hacer un color más claro para subtareas
    const hex = parent.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Aumentar brillo
    const newR = Math.min(255, r + 40);
    const newG = Math.min(255, g + 40);
    const newB = Math.min(255, b + 40);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  function getTaskLevel(task: Task): number {
    let level = 0;
    let current = task;

    while (current.parentId) {
      const parent = tasks.find(t => t.id === current.parentId);
      if (!parent) break;
      current = parent;
      level++;
    }

    return level;
  }

  function getIndentedName(task: Task) {
    const level = getTaskLevel(task);
    return `${"— ".repeat(level)}${task.name}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Nombre de la tarea
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Diseñar interfaz"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Tarea principal (opcional)
        </label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin tarea principal</option>
          {tasks.map(task => (
            <option key={task.id} value={task.id}>
              {getIndentedName(task)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Fecha de inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Fecha de fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {!parentId && (
        <div>
          <label className="block text-sm text-gray-700 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  color === c ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {editingTask ? 'Actualizar' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
