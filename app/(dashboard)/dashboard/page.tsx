import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import CreateWorkspaceForm from "@/components/workspace/CreateWorkspaceForm"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get all workspaces this user belongs to
  const result = await db.query(
    `SELECT 
      w.id, 
      w.name, 
      w.slug, 
      w.plan,
      wm.role
     FROM workspaces w
     INNER JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1
     ORDER BY w.created_at ASC`,
    [session.user.id]
  )

  const workspaces = result.rows

  // No workspaces yet → show create workspace form
  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-300 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Taskly, {session.user.name?.split(" ")[0]}
            </h1>
            <p className="text-gray-500 mt-2">
              Create your first workspace to get started
            </p>
          </div>
          <CreateWorkspaceForm />
        </div>
      </div>
    )
  }

  // Has workspaces → show list
  return (
    <div className="min-h-screen bg-gray-300 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Workspaces</h1>
            <p className="text-gray-500 text-sm mt-1">
              {workspaces.length} workspace{workspaces.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              className="bg-gray-200 border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                <span className="text-white font-bold text-lg">
                  {ws.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{ws.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500 capitalize">{ws.role}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 capitalize">
                  {ws.plan}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}