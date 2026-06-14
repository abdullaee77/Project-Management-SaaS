import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canManageWorkspace } from "@/lib/workspace"

// ============================================
// PATCH — Change a member's role
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, memberId } = await params
    const { role } = await req.json()

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Step 1 — Check permission
    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!canManageWorkspace(myRole)) {
      return NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 })
    }

    // Step 2 — Can't change your own role
    if (memberId === session.user.id) {
      return NextResponse.json({ error: "You can't change your own role" }, { status: 403 })
    }

    // Step 3 — Can't change the owner's role
    const targetRole = await getMemberRole(workspaceId, memberId)
    if (targetRole === "owner") {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 })
    }

    // Step 4 — Update
    await db.query(
      `UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3`,
      [role, workspaceId, memberId]
    )

    return NextResponse.json({ message: "Role updated" })

  } catch (error) {
    console.error("Update role error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// DELETE — Remove a member from workspace
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, memberId } = await params

    const myRole = await getMemberRole(workspaceId, session.user.id)
    if (!canManageWorkspace(myRole)) {
      return NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 })
    }

    if (memberId === session.user.id) {
      return NextResponse.json({ error: "You can't remove yourself" }, { status: 403 })
    }

    const targetRole = await getMemberRole(workspaceId, memberId)
    if (targetRole === "owner") {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 403 })
    }

    await db.query(
      `DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, memberId]
    )

    return NextResponse.json({ message: "Member removed" })

  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}