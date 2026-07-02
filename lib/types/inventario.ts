// ============================================================
// Inventario - Productos y Categorías
// ============================================================

export interface Categoria {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string | null;
}

export interface Producto {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_venta: number;
  costo: number;
  stock: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  categorias?: { nombre: string } | null;
}

export interface ProductoInput {
  categoria_id?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  precio_venta: number;
  costo: number;
  stock?: number;
  activo?: boolean;
}

// Para importar/exportar CSV
export interface ProductoCSV {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio_venta: number;
  costo: number;
  stock: number;
}