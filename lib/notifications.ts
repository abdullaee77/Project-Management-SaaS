import { db } from "./db"
import { v4 as uuidv4 } from "uuid"

export async function createNotification({
  userId,
  workspaceId,
  title,
  message,
  type,
  link,
}: {
  userId: string
  workspaceId?: string | null
  title: string
  message: string
  type: string
  link?: string | null
}) {
  await db.query(
    `INSERT INTO notifications (id, user_id, workspace_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), userId, workspaceId || null, title, message, type, link || null]
  )
}