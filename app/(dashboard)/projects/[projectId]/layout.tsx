import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { getMemberRole } from "@/lib/workspace"
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar"
import ProjectHeader from "@/components/projects/ProjectHeader"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const result = await db.query(
    `SELECT p.*, w.name as workspace_name
     FROM projects p
     INNER JOIN workspaces w ON w.id = p.workspace_id
     WHERE p.id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    notFound()
  }

  const project = result.rows[0]

  const myRole = await getMemberRole(project.workspace_id, session.user.id)
  if (!myRole) {
    notFound()
  }

  const workspace = { id: project.workspace_id, name: project.workspace_name, role: myRole }

  return (
    <div className="min-h-screen bg-gray-200 flex">
      <WorkspaceSidebar workspace={workspace} />
      <main className="flex-1 flex flex-col">
        <ProjectHeader project={project} />
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  )
}