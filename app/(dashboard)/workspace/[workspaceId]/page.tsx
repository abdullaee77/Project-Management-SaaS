import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { canCreateProject } from "@/lib/workspace"
import CreateProject from "@/components/projects/CreateProject"
import ProjectCard from "@/components/projects/ProjectCard"

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

  const wsResult = await db.query(
    `SELECT w.id, w.name, w.slug, w.plan, wm.role
     FROM workspaces w
     INNER JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE w.id = $1 AND wm.user_id = $2`,
    [workspaceId, session.user.id]
  )

  if (wsResult.rows.length === 0) {
    notFound()
  }

  const workspace = wsResult.rows[0]

  const projectsResult = await db.query(
    `SELECT p.*, 
       COUNT(t.id) as task_count,
       COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_count
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.workspace_id = $1 AND p.status != 'archived'
     GROUP BY p.id
     ORDER BY p.created_at ASC`,
    [workspaceId]
  )

  const projects = projectsResult.rows

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {workspace.role} · {workspace.plan} plan
          </p>
        </div>
        {canCreateProject(workspace.role) && (
          <CreateProject workspaceId={workspaceId} />
        )}
      </div>

      {projects.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-gray-200 border-dashed text-center">
          <p className="text-gray-400 mb-1">No projects yet</p>
          <p className="text-sm text-gray-400">
            {canCreateProject(workspace.role)
              ? "Create your first project to get started"
              : "Ask an admin to create a project"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}