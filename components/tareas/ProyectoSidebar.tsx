"use client";

import { useState } from "react";
import type { Proyecto } from "@/lib/types/tareas";
import { Plus, Search, FolderKanban } from "lucide-react";

interface ProyectoSidebarProps {
  proyectos: Proyecto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

const estadoColors: Record<string, string> = {
  activo: "bg-green-500",
  pausado: "bg-yellow-500",
  completado: "bg-blue-500",
  cancelado: "bg-red-500",
};

export default function ProyectoSidebar({ proyectos, selectedId, onSelect, onNew }: ProyectoSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = proyectos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FolderKanban size={16} className="text-blue-600" />
            Proyectos
          </h3>
          <button
            onClick={onNew}
            className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-700"
            title="Nuevo proyecto"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            {search ? "Sin resultados" : "Sin proyectos"}
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedId === p.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${estadoColors[p.estado] || "bg-gray-300"}`} />
                  <span className="truncate font-medium">{p.nombre}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 pl-4">
                  <span className="text-[10px] text-gray-400 capitalize">{p.estado}</span>
                  {p.responsable_id && (
                    <span className="text-[10px] text-gray-400">· Asignado</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}