import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getMemberRole } from "@/lib/workspace"
import { cloudinary } from "@/lib/cloudinary"
import { v4 as uuidv4 } from "uuid"

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

// ============================================
// GET — List attachments for a task
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const taskResult = await db.query(`SELECT workspace_id FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const myRole = await getMemberRole(taskResult.rows[0].workspace_id, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const result = await db.query(
      `SELECT a.*, u.name as uploaded_by_name
       FROM task_attachments a
       INNER JOIN users u ON u.id = a.uploaded_by
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [taskId]
    )

    return NextResponse.json({ attachments: result.rows }, { status: 200 })

  } catch (error) {
    console.error("Get attachments error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// ============================================
// POST — Upload a new attachment
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const taskResult = await db.query(`SELECT workspace_id FROM tasks WHERE id = $1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const myRole = await getMemberRole(taskResult.rows[0].workspace_id, session.user.id)
    if (!myRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Step 1 — Get the file from form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Step 2 — Validate type and size
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 })
    }

    // Step 3 — Convert file to base64 (required by Cloudinary's API)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Step 4 — Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: `taskly/tasks/${taskId}`,
      resource_type: "auto",
    })

    // Step 5 — Save record in database
    const attachmentId = uuidv4()
    await db.query(
      `INSERT INTO task_attachments (id, task_id, uploaded_by, file_name, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [attachmentId, taskId, session.user.id, file.name, uploadResult.secure_url, file.type, file.size]
    )

    return NextResponse.json(
      {
        attachment: {
          id: attachmentId,
          file_name: file.name,
          file_url: uploadResult.secure_url,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: session.user.id,
          uploaded_by_name: session.user.name,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Upload attachment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}