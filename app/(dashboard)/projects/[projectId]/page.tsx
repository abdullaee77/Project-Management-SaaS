import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { getMemberRole, canCreateProject } from "@/lib/workspace"
import KanbanBoard from "@/components/kanban/KanbanBoard"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const projectResult = await db.query(`SELECT * FROM projects WHERE id = $1`, [projectId])
  if (projectResult.rows.length === 0) {
    notFound()
  }
  const project = projectResult.rows[0]

  const myRole = await getMemberRole(project.workspace_id, session.user.id)
  if (!myRole) {
    notFound()
  }

  const tasksResult = await db.query(
    `SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.project_id = $1
     ORDER BY t.position ASC`,
    [projectId]
  )

  const membersResult = await db.query(
    `SELECT u.id, u.name, u.avatar
     FROM workspace_members wm
     INNER JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1
     ORDER BY u.name ASC`,
    [project.workspace_id]
  )

  return (
    <KanbanBoard
      projectId={projectId}
      initialTasks={tasksResult.rows}
      members={membersResult.rows}
      canEdit={canCreateProject(myRole)}
    />
  )
}