import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { getMemberRole, canManageWorkspace } from "@/lib/workspace"
import InviteMember from "@/components/workspace/InviteMember"
import MemberList from "@/components/workspace/MemberList"

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const myRole = await getMemberRole(workspaceId, session.user.id)
  if (!myRole) {
    notFound()
  }

  // Get all members
  const membersResult = await db.query(
    `SELECT u.id, u.name, u.email, u.avatar, wm.role
     FROM workspace_members wm
     INNER JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1
     ORDER BY 
       CASE wm.role 
         WHEN 'owner' THEN 1 
         WHEN 'admin' THEN 2 
         WHEN 'member' THEN 3 
         ELSE 4 
       END,
       wm.joined_at ASC`,
    [workspaceId]
  )

  // Get pending invitations (only if user can manage)
  let invitations: any[] = []
  if (canManageWorkspace(myRole)) {
    const inviteResult = await db.query(
      `SELECT id, email, role, created_at
       FROM invitations
       WHERE workspace_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [workspaceId]
    )
    invitations = inviteResult.rows
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Members</h1>
      <p className="text-gray-500 text-sm mb-6">
        Manage who has access to this workspace
      </p>

      {canManageWorkspace(myRole) && (
        <InviteMember workspaceId={workspaceId} />
      )}

      <MemberList
        workspaceId={workspaceId}
        members={membersResult.rows}
        invitations={invitations}
        myRole={myRole}
        myUserId={session.user.id}
      />
    </div>
  )
}