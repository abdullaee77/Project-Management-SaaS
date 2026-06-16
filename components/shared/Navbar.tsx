import Link from "next/link"
import NotificationBell from "./NotificationBell"

export default function Navbar({ userName }: { userName?: string | null }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <Link href="/dashboard" className="font-bold text-gray-900">
        Taskly
      </Link>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <Link
          href="/settings"
          className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline"
        >
          {userName}
        </Link>
        <Link href="/api/auth/signout" className="text-sm text-gray-400 hover:text-gray-600">
          Sign out
        </Link>
      </div>
    </header>
  )
}