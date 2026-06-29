-- ============================================================
-- AGET - Schema de Base de Datos (public)
-- Sistema de Gestión PYME SaaS
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pegar > Run
-- ============================================================

-- ---- Empleados ----
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  puesto TEXT NOT NULL,
  salario DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Departamentos ----
CREATE TABLE IF NOT EXISTS departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Asistencia ----
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'tarde', 'permiso');

CREATE TABLE IF NOT EXISTS asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado estado_asistencia NOT NULL DEFAULT 'presente',
  hora_entrada TIME,
  hora_salida TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empleado_id, fecha)
);

-- ---- Proyectos ----
CREATE TYPE estado_proyecto AS ENUM ('activo', 'pausado', 'completado', 'cancelado');
CREATE TYPE prioridad AS ENUM ('baja', 'media', 'alta', 'urgente');

CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ---- Tareas (Kanban) ----
CREATE TYPE columna_kanban AS ENUM ('pendientes', 'en_progreso', 'en_revision', 'completadas');

CREATE TABLE IF NOT EXISTS tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ---- Comentarios ----
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  autor_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Clientes ----
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuesto DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado estado_factura NOT NULL DEFAULT 'pendiente',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Detalles de Factura ----
CREATE TABLE IF NOT EXISTS detalles_factura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
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
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  metodo metodo_pago NOT NULL DEFAULT 'efectivo',
  referencia TEXT,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para mejorar performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_empleados_departamento ON empleados(departamento_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_empleado ON asistencia(empleado_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_columna ON tareas(columna);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_factura ON detalles_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON pagos(factura_id);

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
-- Cualquier usuario autenticado puede leer, crear, editar y eliminar
-- ============================================================
-- Ya habilitado desde el schema original:
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- Ahora creamos las políticas para usuarios autenticados:

-- Empleados
CREATE POLICY "Usuarios autenticados pueden ver empleados" ON empleados FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear empleados" ON empleados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar empleados" ON empleados FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar empleados" ON empleados FOR DELETE USING (auth.role() = 'authenticated');

-- Departamentos
CREATE POLICY "Usuarios autenticados pueden ver departamentos" ON departamentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear departamentos" ON departamentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar departamentos" ON departamentos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar departamentos" ON departamentos FOR DELETE USING (auth.role() = 'authenticated');

-- Asistencia
CREATE POLICY "Usuarios autenticados pueden ver asistencia" ON asistencia FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear asistencia" ON asistencia FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar asistencia" ON asistencia FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar asistencia" ON asistencia FOR DELETE USING (auth.role() = 'authenticated');

-- Proyectos
CREATE POLICY "Usuarios autenticados pueden ver proyectos" ON proyectos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear proyectos" ON proyectos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar proyectos" ON proyectos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar proyectos" ON proyectos FOR DELETE USING (auth.role() = 'authenticated');

-- Tareas
CREATE POLICY "Usuarios autenticados pueden ver tareas" ON tareas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear tareas" ON tareas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar tareas" ON tareas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar tareas" ON tareas FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios
CREATE POLICY "Usuarios autenticados pueden ver comentarios" ON comentarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON comentarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar comentarios" ON comentarios FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar comentarios" ON comentarios FOR DELETE USING (auth.role() = 'authenticated');

-- Clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar clientes" ON clientes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clientes FOR DELETE USING (auth.role() = 'authenticated');

-- Facturas
CREATE POLICY "Usuarios autenticados pueden ver facturas" ON facturas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear facturas" ON facturas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar facturas" ON facturas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar facturas" ON facturas FOR DELETE USING (auth.role() = 'authenticated');

-- Detalles de Factura
CREATE POLICY "Usuarios autenticados pueden ver detalles" ON detalles_factura FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear detalles" ON detalles_factura FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar detalles" ON detalles_factura FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar detalles" ON detalles_factura FOR DELETE USING (auth.role() = 'authenticated');

-- Pagos
CREATE POLICY "Usuarios autenticados pueden ver pagos" ON pagos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden crear pagos" ON pagos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden editar pagos" ON pagos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar pagos" ON pagos FOR DELETE USING (auth.role() = 'authenticated');
