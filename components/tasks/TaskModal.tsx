'use client'

import { useState } from "react"
import Modal from "@/components/shared/Modal"
import TaskComments from "./TaskComments"
import TaskActivity from "./TaskActivity"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  assignee_id: string | null
  assignee_name: string | null
}

interface Member {
  id: string
  name: string
  avatar: string | null
}

interface TaskModalProps {
  task: Task
  members: Member[]
  canEdit: boolean
  onClose: () => void
  onUpdate: (taskId: string, fields: Partial<Task> & { assigneeId?: string | null; dueDate?: string | null }) => void
  onDelete: (taskId: string) => void
}

export default function TaskModal({ task, members, canEdit, onClose, onUpdate, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments")
  const [activityKey, setActivityKey] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const patch = async (body: Record<string, any>) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setActivityKey((k) => k + 1)
  }

  const handleTitleBlur = async () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) {
      await patch({ title: trimmed })
      onUpdate(task.id, { title: trimmed })
    } else {
      setTitle(task.title)
    }
  }

  const handleDescriptionBlur = async () => {
    const trimmed = description.trim()
    if (trimmed !== (task.description || "")) {
      await patch({ description: trimmed })
      onUpdate(task.id, { description: trimmed || null })
    }
  }

  const handleStatusChange = async (value: string) => {
    await patch({ status: value })
    onUpdate(task.id, { status: value })
  }

  const handlePriorityChange = async (value: string) => {
    await patch({ priority: value })
    onUpdate(task.id, { priority: value })
  }

  const handleAssigneeChange = async (value: string) => {
    const assigneeId = value || null
    await patch({ assigneeId })
    const assignee = members.find((m) => m.id === value)
    onUpdate(task.id, { assignee_id: assigneeId, assignee_name: assignee?.name || null })
  }

  const handleDueDateChange = async (value: string) => {
    const dueDate = value || null
    await patch({ dueDate })
    onUpdate(task.id, { due_date: dueDate })
  }

  const handleDelete = async () => {
    if (!confirm("Delete this task? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      if (res.ok) {
        onDelete(task.id)
        onClose()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Task details" size="lg">
      <div className="space-y-4">

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          disabled={!canEdit}
          className="w-full text-lg font-semibold text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-1 disabled:bg-transparent"
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            disabled={!canEdit}
            rows={3}
            placeholder="Add a description..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none disabled:bg-gray-50"
          />
        </div>

        {/* Status / Priority / Assignee / Due date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
            <select
              value={task.assignee_id || ""}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
            <input
              type="date"
value={task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""}
              onChange={(e) => handleDueDateChange(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("comments")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "comments" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "activity" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Activity
            </button>
          </div>

          <div className="pt-3">
            {activeTab === "comments" ? (
              <TaskComments taskId={task.id} />
            ) : (
              <TaskActivity taskId={task.id} refreshKey={activityKey} />
            )}
          </div>
        </div>

        {/* Delete */}
        {canEdit && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete task"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}