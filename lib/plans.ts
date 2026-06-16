import { db } from "./db"

export const PLAN_LIMITS = {
  free: {
    projects: 3,
    members: 5,
  },
  pro: {
    projects: Infinity,
    members: Infinity,
  },
}

export async function getWorkspacePlan(workspaceId: string): Promise<"free" | "pro"> {
  const result = await db.query(
    `SELECT plan FROM workspaces WHERE id = $1`,
    [workspaceId]
  )
  return result.rows[0]?.plan || "free"
}

export async function checkProjectLimit(workspaceId: string): Promise<boolean> {
  const plan = await getWorkspacePlan(workspaceId)
  const limit = PLAN_LIMITS[plan].projects
  if (limit === Infinity) return true

  const result = await db.query(
    `SELECT COUNT(*) FROM projects WHERE workspace_id = $1 AND status != 'archived'`,
    [workspaceId]
  )
  return Number(result.rows[0].count) < limit
}

export async function checkMemberLimit(workspaceId: string): Promise<boolean> {
  const plan = await getWorkspacePlan(workspaceId)
  const limit = PLAN_LIMITS[plan].members
  if (limit === Infinity) return true

  const result = await db.query(
    `SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1`,
    [workspaceId]
  )
  return Number(result.rows[0].count) < limit
}