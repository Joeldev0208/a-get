import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DemoPage from "./page";

// Mock de next/navigation para evitar errores de useRouter
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/demo/home"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

const getSidebarNav = () => {
  const aside = document.querySelector("aside");
  if (!aside) throw new Error("Sidebar aside not found");
  const nav = aside.querySelector("nav");
  if (!nav) throw new Error("Sidebar nav not found");
  return nav;
};

describe("Demo Page - English static data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the demo page without crashing", () => {
    render(<DemoPage />);
    expect(screen.getByText("AGET Demo")).toBeInTheDocument();
  });

  it("displays English labels in the sidebar", () => {
    render(<DemoPage />);
    const nav = getSidebarNav();
    expect(within(nav).getByText("Home")).toBeInTheDocument();
    expect(within(nav).getByText("HR")).toBeInTheDocument();
    expect(within(nav).getByText("Inventory")).toBeInTheDocument();
    expect(within(nav).getByText("Sales")).toBeInTheDocument();
    expect(within(nav).getByText("Tasks")).toBeInTheDocument();
    expect(within(nav).getByText("Settings")).toBeInTheDocument();
  });

  it("displays English submenu items", () => {
    render(<DemoPage />);
    expect(screen.getByText("Employees")).toBeInTheDocument();
  });

  it("displays English module titles and table headers for Products", () => {
    render(<DemoPage />);
    const nav = getSidebarNav();
    // Products submenu is visible by default (Inventory expanded)
    fireEvent.click(within(nav).getByText("Products"));

    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Sale Price")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
  });

  it("displays English sales statuses and methods", () => {
    render(<DemoPage />);
    const nav = getSidebarNav();
    fireEvent.click(within(nav).getByText("Sales"));
    fireEvent.click(within(nav).getByText("Point of Sale"));

    expect(screen.getByRole("heading", { name: "Sales / POS" })).toBeInTheDocument();
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cash").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transfer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Card").length).toBeGreaterThan(0);
  });

  it("displays English product data", () => {
    render(<DemoPage />);
    const nav = getSidebarNav();
    fireEvent.click(within(nav).getByText("Products"));

    // Product names appear in both desktop table and mobile cards
    expect(screen.getAllByText("Laptop Dell Latitude 5420").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wireless Keyboard").length).toBeGreaterThan(0);
  });

  it("displays English task statuses and priorities", () => {
    render(<DemoPage />);
    const nav = getSidebarNav();
    fireEvent.click(within(nav).getByText("Tasks"));
    fireEvent.click(within(nav).getByText("Kanban Board"));

    expect(screen.getByRole("heading", { name: "Tasks / Kanban" })).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("displays English navbar and demo mode text", () => {
    render(<DemoPage />);
    expect(screen.getAllByText("Demo mode").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Demo user").length).toBeGreaterThan(0);

    // Open user menu to reveal "Close demo session"
    const userBtns = screen.getAllByText("Bob Demo");
    const navbarUserBtn = userBtns[userBtns.length - 1]?.closest("button");
    if (navbarUserBtn) {
      fireEvent.click(navbarUserBtn);
      expect(screen.getByText("Close demo session")).toBeInTheDocument();
    }
  });

  it("does NOT display Spanish keywords", () => {
    render(<DemoPage />);
    const spanishKeywords = [
      "Inicio",
      "RR.HH.",
      "Empleados",
      "Productos",
      "Ventas",
      "Clientes",
      "Facturas",
      "Tareas",
      "Configuración",
      "Pagada",
      "Pendiente",
      "Efectivo",
      "Transferencia",
      "Activo",
      "Agotado",
      "Modo demostración",
      "Usuario demo",
      "Cerrar sesión",
    ];

    const bodyText = document.body.textContent || "";
    for (const keyword of spanishKeywords) {
      expect(bodyText).not.toContain(keyword);
    }
  });

  it("navigates between modules via sidebar", () => {
    render(<DemoPage />);
    const nav = getSidebarNav();

    fireEvent.click(within(nav).getByText("Home"));
    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();

    fireEvent.click(within(nav).getByText("HR"));
    expect(screen.getByText("Employees")).toBeInTheDocument();

    fireEvent.click(within(nav).getByText("Inventory"));
    fireEvent.click(within(nav).getByText("Products"));
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();

    fireEvent.click(within(nav).getByText("Sales"));
    fireEvent.click(within(nav).getByText("Point of Sale"));
    expect(screen.getByRole("heading", { name: "Sales / POS" })).toBeInTheDocument();

    fireEvent.click(within(nav).getByText("Tasks"));
    fireEvent.click(within(nav).getByText("Kanban Board"));
    expect(screen.getByRole("heading", { name: "Tasks / Kanban" })).toBeInTheDocument();

    fireEvent.click(within(nav).getByText("Settings"));
    fireEvent.click(within(nav).getByText("My Company"));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });
});
