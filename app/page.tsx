import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-12">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          AGET
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/inicio"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/inicio"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-12">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Gestiona tu PYME de forma{" "}
          <span className="text-blue-600">inteligente</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          AGET es un sistema SaaS completo para la gestión de RR.HH., Tareas y
          Facturación de tu empresa. Todo en un solo lugar, simple y eficiente.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/inicio"
            className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700"
          >
            Comenzar ahora
          </Link>
          <Link
            href="#features"
            className="rounded-lg border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Conocer más
          </Link>
        </div>

        {/* Features grid */}
        <div
          id="features"
          className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-blue-100 bg-white p-6 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">RR.HH.</h3>
            <p className="mt-2 text-sm text-slate-600">
              Gestiona empleados, departamentos y asistencia de forma sencilla.
            </p>
          </div>

          <div className="rounded-xl border border-green-100 bg-white p-6 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Tareas</h3>
            <p className="mt-2 text-sm text-slate-600">
              Organiza proyectos con tablero Kanban y mantén el control.
            </p>
          </div>

          <div className="rounded-xl border border-purple-100 bg-white p-6 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Facturación</h3>
            <p className="mt-2 text-sm text-slate-600">
              Crea facturas, gestiona clientes y registra pagos fácilmente.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} AGET. Todos los derechos reservados.
      </footer>
    </div>
  );
}