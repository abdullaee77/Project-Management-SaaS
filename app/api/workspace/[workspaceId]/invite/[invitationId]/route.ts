import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canManageWorkspace } from "@/lib/workspace"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; invitationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, invitationId } = await params

    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!canManageWorkspace(myRole)) {
      return NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 })
    }

    await db.query(
      `DELETE FROM invitations WHERE id = $1 AND workspace_id = $2`,
      [invitationId, workspaceId]
    )

    return NextResponse.json({ message: "Invitation cancelled" })

  } catch (error) {
    console.error("Cancel invite error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}