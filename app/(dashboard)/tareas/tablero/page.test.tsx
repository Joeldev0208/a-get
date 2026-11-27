import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TableroPage from "./page";
import type { TareaConAsignado } from "@/lib/types/tareas";

// Mock de servicios de Supabase
vi.mock("@/lib/services/tareas.service", () => ({
  listarTareasPorColumna: vi.fn(() => Promise.resolve([])),
  listarProyectos: vi.fn(() => Promise.resolve([])),
  crearTarea: vi.fn(() => Promise.resolve()),
  actualizarTarea: vi.fn(() => Promise.resolve()),
  moverTarea: vi.fn(() => Promise.resolve()),
  eliminarTarea: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/services/rrhh.service", () => ({
  listarEmpleados: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/services/empresa", () => ({
  obtenerPerfilActual: vi.fn(() =>
    Promise.resolve({ empresa_id: "emp-1", rol: "gerente", activo: true }),
  ),
}));

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  usePathname: vi.fn(() => "/tareas/tablero"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock de i18next con traducciones en inglés
vi.mock("react-i18next", () => ({
  useTranslation: () => {
    const dict: Record<string, string> = {
      "tareas.kanban": "Kanban Board",
      "tareas.noTasks": "No tasks",
      "tareas.addTask": "Add Task",
      "tareas.pending": "Pending",
      "tareas.inProgress": "In Progress",
      "tareas.review": "Review",
      "tareas.completed": "Completed",
      "tareas.low": "Low",
      "tareas.medium": "Medium",
      "tareas.high": "High",
      "tareas.urgent": "Urgent",
      "tareas.taskTitle": "Task Title",
      "tareas.description": "Description",
      "tareas.column": "Column",
      "tareas.priority": "Priority",
    };
    return {
      t: (key: string) => dict[key] ?? key,
      i18n: { language: "en", changeLanguage: vi.fn() },
    };
  },
  useSSR: vi.fn(() => ({ i18n: { language: "en" } })),
}));

const mockTarea: TareaConAsignado = {
  id: "t-1",
  empresa_id: "emp-1",
  proyecto_id: "p-1",
  titulo: "Sample Task",
  descripcion: null,
  columna: "pendientes",
  prioridad: "media",
  orden: 0,
  asignado_id: null,
  fecha_limite: null,
  created_at: "2026-11-20T00:00:00Z",
  updated_at: "2026-11-20T00:00:00Z",
  empleados: null,
  proyectos: null,
};

describe("Tablero Kanban - Tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the kanban board without crashing when there are no tasks", async () => {
    render(<TableroPage />);

    await waitFor(() => {
      expect(screen.getByText("Kanban Board")).toBeInTheDocument();
    });

    expect(screen.getByText("No tasks")).toBeInTheDocument();
    expect(screen.getAllByText("Add Task").length).toBeGreaterThan(0);
  });

  it("displays English column titles when tasks exist", async () => {
    const { listarTareasPorColumna } = await import("@/lib/services/tareas.service");
    (listarTareasPorColumna as any).mockImplementation((_empId: string, columna: string) =>
      Promise.resolve(columna === "pendientes" ? [mockTarea] : []),
    );

    render(<TableroPage />);

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Sample Task")).toBeInTheDocument();
  });

  it("calls listarTareasPorColumna for each column on load", async () => {
    const { listarTareasPorColumna } = await import("@/lib/services/tareas.service");
    render(<TableroPage />);
    await waitFor(() => {
      expect(listarTareasPorColumna).toHaveBeenCalled();
    });
    expect(listarTareasPorColumna).toHaveBeenCalledTimes(4);
  });

  it("displays English page heading", async () => {
    render(<TableroPage />);
    await waitFor(() => {
      expect(screen.getByText("Kanban Board")).toBeInTheDocument();
    });
  });
});
