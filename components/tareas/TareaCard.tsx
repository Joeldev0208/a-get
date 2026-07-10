"use client";

import type { TareaConAsignado } from "@/lib/types/tareas";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, User, Trash2 } from "lucide-react";

const prioridadStyles: Record<string, string> = {
  urgente: "border-l-red-500 bg-red-50",
  alta: "border-l-orange-500 bg-orange-50",
  media: "border-l-blue-500 bg-blue-50",
  baja: "border-l-gray-400 bg-gray-50",
};

const prioridadLabels: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

interface TareaCardProps {
  tarea: TareaConAsignado;
  onEdit?: (tarea: TareaConAsignado) => void;
  onDelete?: (tareaId: string) => void;
}

export default function TareaCard({ tarea, onEdit, onDelete }: TareaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarea.id,
    data: { type: "tarea", tarea },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-l-4 p-3 shadow-sm ${
        prioridadStyles[tarea.prioridad] || "bg-white"
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => onEdit?.(tarea)}
            className="w-full text-left"
          >
            <p className="text-sm font-medium text-gray-900 truncate">{tarea.titulo}</p>
          </button>
          {tarea.descripcion && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{tarea.descripcion}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
              tarea.prioridad === "urgente" ? "bg-red-100 text-red-700" :
              tarea.prioridad === "alta" ? "bg-orange-100 text-orange-700" :
              tarea.prioridad === "media" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {prioridadLabels[tarea.prioridad]}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {tarea.empleados && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <User size={10} />
                {tarea.empleados.nombre}
              </span>
            )}
            {tarea.fecha_limite && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Calendar size={10} />
                {new Date(tarea.fecha_limite).toLocaleDateString("es-DO")}
              </span>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(tarea.id); }}
                className="ml-auto rounded p-0.5 text-gray-300 hover:text-red-500"
                title="Eliminar tarea"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}