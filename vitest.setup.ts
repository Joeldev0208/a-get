import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock de window.scrollTo (no implementado en jsdom)
window.scrollTo = vi.fn(() => {});
