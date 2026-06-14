import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const result = await db.query(
    `SELECT w.id, w.name, w.slug, w.plan, wm.role
     FROM workspaces w
     INNER JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE w.id = $1 AND wm.user_id = $2`,
    [workspaceId, session.user.id]
  )

  if (result.rows.length === 0) {
    notFound()
  }

  const workspace = result.rows[0]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkspaceSidebar workspace={workspace} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}