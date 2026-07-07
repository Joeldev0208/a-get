"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TareaCard from "./TareaCard";
import type { TareaConAsignado, ColumnaKanban } from "@/lib/types/tareas";
import { Plus, Loader2 } from "lucide-react";

interface KanbanBoardProps {
  tareas: TareaConAsignado[];
  proyectoId: string;
  onMoverTarea: (tareaId: string, nuevaColumna: ColumnaKanban) => Promise<void>;
  onNuevaTarea: () => void;
  loading?: boolean;
}

const COLUMNAS: { id: ColumnaKanban; label: string; color: string }[] = [
  { id: "pendientes", label: "Pendientes", color: "border-t-gray-400" },
  { id: "en_progreso", label: "En Progreso", color: "border-t-blue-500" },
  { id: "en_revision", label: "En Revisión", color: "border-t-yellow-500" },
  { id: "completadas", label: "Completadas", color: "border-t-green-500" },
];

export default function KanbanBoard({ tareas, proyectoId, onMoverTarea, onNuevaTarea, loading }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const tareasPorColumna = (columna: ColumnaKanban) =>
    tareas
      .filter((t) => t.columna === columna)
      .sort((a, b) => a.orden - b.orden);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const tareaId = active.id as string;
    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea) return;

    // Determinar la columna destino
    let nuevaColumna: ColumnaKanban | null = null;

    // Si soltó sobre otra tarea, obtener su columna
    const overTarea = tareas.find((t) => t.id === over.id);
    if (overTarea) {
      nuevaColumna = overTarea.columna;
    }

    // Si soltó sobre el contenedor de columna
    const columnaDestino = COLUMNAS.find((c) => c.id === over.id);
    if (columnaDestino) {
      nuevaColumna = columnaDestino.id;
    }

    if (nuevaColumna && nuevaColumna !== tarea.columna) {
      await onMoverTarea(tareaId, nuevaColumna);
    }
  };

  const activeTarea = activeId ? tareas.find((t) => t.id === activeId) : null;

  if (!proyectoId) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-400">Selecciona un proyecto para ver su tablero Kanban</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Tablero Kanban</h3>
        <button
          onClick={onNuevaTarea}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus size={14} />
          Nueva Tarea
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4 h-[calc(100vh-280px)]">
            {COLUMNAS.map((col) => {
              const items = tareasPorColumna(col.id);
              return (
                <div
                  key={col.id}
                  id={col.id}
                  className={`flex flex-col rounded-xl border border-gray-200 bg-gray-50 border-t-4 ${col.color}`}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    <SortableContext
                      items={items.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {items.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-[10px] text-gray-400">Sin tareas</p>
                        </div>
                      ) : (
                        items.map((tarea) => (
                          <TareaCard key={tarea.id} tarea={tarea} />
                        ))
                      )}
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTarea ? (
              <div className="opacity-80">
                <TareaCard tarea={activeTarea} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}