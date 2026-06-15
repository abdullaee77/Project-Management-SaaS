import { db } from "./db"

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer"

// Get a user's role in a workspace, or null if they're not a member
export async function getMemberRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const result = await db.query(
    `SELECT role FROM workspace_members 
     WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  )

  if (result.rows.length === 0) return null
  return result.rows[0].role as WorkspaceRole
}

// Only Owner and Admin can manage workspace (invite, remove members, etc)
export function canManageWorkspace(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin"
}
// Owner, Admin, Member can create projects — Viewers cannot
export function canCreateProject(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin" || role === "member"
}