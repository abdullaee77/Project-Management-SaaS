import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"

export default async function WorkspacePage({
  params,
}: {
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
      <p className="text-gray-500 mt-1 text-sm capitalize">
        Your role: {workspace.role} · {workspace.plan} plan
      </p>

      <div className="mt-8 p-12 bg-white rounded-xl border border-gray-200 text-center">
        <p className="text-gray-400">Projects coming soon...</p>
      </div>
    </div>
  )
}