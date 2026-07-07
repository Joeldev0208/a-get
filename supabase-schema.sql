-- ============================================================
-- AGET - Schema de Base de Datos (public)
-- Sistema de Gestión PYME SaaS
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pegar > Run
-- ============================================================

-- ============================================================
-- 1. SISTEMA DE EMPRESAS Y ROLES
-- ============================================================

-- Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo_unico TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfiles de usuario (vincula auth.users con empresa y rol)
CREATE TYPE rol_usuario AS ENUM (
  'gerente',
  'contador',
  'cajero_vendedor',
  'inventario',
  'rrhh',
  'empleado_general'
);

CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  rol rol_usuario NOT NULL DEFAULT 'empleado_general',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, empresa_id)
);

-- ============================================================
-- 2. INVENTARIO
-- ============================================================

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, nombre)
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- ============================================================
-- 3. FACTURACIÓN / VENTAS (existente + mejorado)
-- ============================================================

-- ---- Clientes ----
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  rnc_cedula TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Facturas ----
CREATE TYPE estado_factura AS ENUM ('pendiente', 'pagada', 'vencida', 'cancelada');

CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuesto DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado estado_factura NOT NULL DEFAULT 'pendiente',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, numero)
);

-- ---- Detalles de Factura ----
CREATE TABLE IF NOT EXISTS detalles_factura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Pagos ----
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta', 'cheque');

CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  metodo metodo_pago NOT NULL DEFAULT 'efectivo',
  referencia TEXT,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. RRHH (existente + empresa_id)
-- ============================================================

-- ---- Departamentos ----
CREATE TABLE IF NOT EXISTS departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, nombre)
);

-- ---- Empleados ----
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  puesto TEXT NOT NULL,
  salario DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, email)
);

-- ---- Asistencia ----
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'tarde', 'permiso');

CREATE TABLE IF NOT EXISTS asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado estado_asistencia NOT NULL DEFAULT 'presente',
  hora_entrada TIME,
  hora_salida TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, empleado_id, fecha)
);

-- ============================================================
-- 5. SESIONES (caja / trabajo)
-- ============================================================

CREATE TYPE estado_sesion AS ENUM ('abierta', 'cerrada');

CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES perfiles_usuario(id) ON DELETE SET NULL,
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  estado estado_sesion NOT NULL DEFAULT 'abierta',
  total_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_final DECIMAL(12,2),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_empresa ON sesiones(empresa_id);

ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver sesiones" ON sesiones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear sesiones" ON sesiones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar sesiones" ON sesiones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar sesiones" ON sesiones FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. TAREAS / PROYECTOS (existente + empresa_id)
-- ============================================================

CREATE TYPE estado_proyecto AS ENUM ('activo', 'pausado', 'completado', 'cancelado');
CREATE TYPE prioridad AS ENUM ('baja', 'media', 'alta', 'urgente');

CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado estado_proyecto NOT NULL DEFAULT 'activo',
  prioridad prioridad NOT NULL DEFAULT 'media',
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  responsable_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE columna_kanban AS ENUM ('pendientes', 'en_progreso', 'en_revision', 'completadas');

CREATE TABLE IF NOT EXISTS tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  columna columna_kanban NOT NULL DEFAULT 'pendientes',
  prioridad prioridad NOT NULL DEFAULT 'media',
  orden INTEGER NOT NULL DEFAULT 0,
  asignado_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
  fecha_limite DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  autor_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para mejorar performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_perfiles_user ON perfiles_usuario(user_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_empresa ON perfiles_usuario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(empresa_id, codigo);
CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_empresa ON facturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_factura ON detalles_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa ON pagos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON pagos(factura_id);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_departamento ON empleados(departamento_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_empresa ON asistencia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_empleado ON asistencia(empleado_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_proyectos_empresa ON proyectos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_columna ON tareas(columna);

-- ============================================================
-- TRIGGER para actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
  tables_with_updated_at TEXT[] := ARRAY[
    'empresas', 'perfiles_usuario',
    'categorias', 'productos',
    'empleados', 'departamentos', 'asistencia',
    'proyectos', 'tareas', 'comentarios',
    'clientes', 'facturas', 'pagos'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = tbl) THEN
      EXECUTE format('
        DROP TRIGGER IF EXISTS set_updated_at ON %I;
        CREATE TRIGGER set_updated_at
          BEFORE UPDATE ON %I
          FOR EACH ROW
          EXECUTE FUNCTION trigger_set_updated_at();
      ', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- RLS (Row Level Security) - POLÍTICAS
-- ============================================================

-- Empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver empresas" ON empresas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear empresas" ON empresas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar empresas" ON empresas FOR UPDATE USING (auth.role() = 'authenticated');

-- Perfiles
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver perfiles" ON perfiles_usuario FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear perfiles" ON perfiles_usuario FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar perfiles" ON perfiles_usuario FOR UPDATE USING (auth.role() = 'authenticated');

-- Categorías
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver categorias" ON categorias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear categorias" ON categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar categorias" ON categorias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar categorias" ON categorias FOR DELETE USING (auth.role() = 'authenticated');

-- Productos
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver productos" ON productos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear productos" ON productos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar productos" ON productos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar productos" ON productos FOR DELETE USING (auth.role() = 'authenticated');

-- Clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar clientes" ON clientes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clientes FOR DELETE USING (auth.role() = 'authenticated');

-- Facturas
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver facturas" ON facturas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear facturas" ON facturas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar facturas" ON facturas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar facturas" ON facturas FOR DELETE USING (auth.role() = 'authenticated');

-- Detalles de Factura
ALTER TABLE detalles_factura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver detalles" ON detalles_factura FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear detalles" ON detalles_factura FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar detalles" ON detalles_factura FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar detalles" ON detalles_factura FOR DELETE USING (auth.role() = 'authenticated');

-- Pagos
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver pagos" ON pagos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear pagos" ON pagos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar pagos" ON pagos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar pagos" ON pagos FOR DELETE USING (auth.role() = 'authenticated');

-- Empleados
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver empleados" ON empleados FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear empleados" ON empleados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar empleados" ON empleados FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar empleados" ON empleados FOR DELETE USING (auth.role() = 'authenticated');

-- Departamentos
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver departamentos" ON departamentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear departamentos" ON departamentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar departamentos" ON departamentos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar departamentos" ON departamentos FOR DELETE USING (auth.role() = 'authenticated');

-- Asistencia
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver asistencia" ON asistencia FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear asistencia" ON asistencia FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar asistencia" ON asistencia FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar asistencia" ON asistencia FOR DELETE USING (auth.role() = 'authenticated');

-- Proyectos
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver proyectos" ON proyectos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear proyectos" ON proyectos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar proyectos" ON proyectos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar proyectos" ON proyectos FOR DELETE USING (auth.role() = 'authenticated');

-- Tareas
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver tareas" ON tareas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear tareas" ON tareas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar tareas" ON tareas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar tareas" ON tareas FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados pueden ver comentarios" ON comentarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON comentarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar comentarios" ON comentarios FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar comentarios" ON comentarios FOR DELETE USING (auth.role() = 'authenticated');