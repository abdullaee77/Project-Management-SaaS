import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole, canCreateProject } from "@/lib/workspace"
import { cloudinary } from "@/lib/cloudinary"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId, attachmentId } = await params

    const taskResult = await db.query(`SELECT workspace_id FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const attResult = await db.query(`SELECT * FROM task_attachments WHERE id = $1`, [attachmentId])
    if (attResult.rows.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }
    const attachment = attResult.rows[0]

    const myRole = await getMemberRole(taskResult.rows[0].workspace_id, session.user.id)
    const isOwnUpload = attachment.uploaded_by === session.user.id

    // Can delete if: you have edit permission, OR you uploaded it yourself
    if (!canCreateProject(myRole) && !isOwnUpload) {
      return NextResponse.json({ error: "You don't have permission to delete this" }, { status: 403 })
    }

    // Extract Cloudinary public_id from the URL to delete the actual file
    // URL looks like: https://res.cloudinary.com/.../taskly/tasks/abc123/xyz.png
    const urlParts = attachment.file_url.split("/")
    const folderIndex = urlParts.findIndex((p: string) => p === "taskly")
    const publicIdWithExt = urlParts.slice(folderIndex).join("/")
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "") // remove extension

    try {
      await cloudinary.uploader.destroy(publicId)
    } catch {
      // If Cloudinary delete fails, still remove from DB — don't block the user
    }

    await db.query(`DELETE FROM task_attachments WHERE id = $1`, [attachmentId])

    return NextResponse.json({ message: "Attachment deleted" }, { status: 200 })

  } catch (error) {
    console.error("Delete attachment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}