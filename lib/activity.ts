import { db } from "./db"
import { v4 as uuidv4 } from "uuid"

export async function logTaskActivity(
  taskId: string,
  userId: string,
  action: string,
  oldValue: string | null,
  newValue: string | null
) {
  await db.query(
    `INSERT INTO task_activity (id, task_id, user_id, action, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), taskId, userId, action, oldValue, newValue]
  )
}