'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

interface WorkspaceSidebarProps {
  workspace: { id: string; name: string; role: string }
}

export default function WorkspaceSidebar({ workspace }: WorkspaceSidebarProps) {
  const pathname = usePathname()

const links = [
    { href: `/workspace/${workspace.id}`, label: "Overview" },
    { href: `/workspace/${workspace.id}/members`, label: "Members" },
    { href: `/workspace/${workspace.id}/billing`, label: "Billing" },
  ]

  return (
    <aside className="w-64 bg-gray-300 border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">
            {workspace.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-gray-900 text-sm truncate">{workspace.name}</p>
          <p className="text-xs text-gray-400 capitalize">{workspace.role}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link
          href="/dashboard"
          className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 block"
        >
          ← All workspaces
        </Link>
      </div>
    </aside>
  )
}