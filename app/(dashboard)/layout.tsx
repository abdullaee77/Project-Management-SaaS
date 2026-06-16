import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/shared/Navbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      {children}
    </div>
  )
}