'use client'

import { useState } from "react"
import Modal from "@/components/shared/Modal"

interface Member {
  id: string
  name: string
  avatar: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  position: number
  due_date: string | null
  assignee_id: string | null
  assignee_name: string | null
  assignee_avatar: string | null
}

export default function TaskForm({
  projectId,
  status,
  members,
  onCreated,
}: {
  projectId: string
  status: string
  members: Member[]
  onCreated: (task: Task) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("medium")
  const [assigneeId, setAssigneeId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title,
          status,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      const assignee = members.find((m) => m.id === assigneeId)

      onCreated({
        id: data.task.id,
        title: data.task.title,
        description: null,
        status: data.task.status,
        priority: data.task.priority,
        position: data.task.position,
        due_date: data.task.due_date,
        assignee_id: data.task.assignee_id,
        assignee_name: assignee?.name || null,
        assignee_avatar: assignee?.avatar || null,
      })

      setTitle("")
      setPriority("medium")
      setAssigneeId("")
      setDueDate("")
      setOpen(false)

    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
      >
        + Add task
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create task">
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Creating..." : "Create task"}
          </button>
        </form>
      </Modal>
    </>
  )
}