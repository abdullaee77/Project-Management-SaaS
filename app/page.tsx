import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Taskly</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Manage projects.<br />Ship faster.
          </h2>
          <p className="text-xl text-gray-500 mb-10">
            Taskly helps teams plan, track, and deliver work together.
            Real-time updates, role-based access, and powerful analytics.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-base hover:bg-blue-700 transition-colors"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="text-gray-600 px-8 py-3 rounded-lg font-medium text-base border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        © 2024 Taskly. Built with Next.js + PostgreSQL.
      </footer>

    </div>
  )
}