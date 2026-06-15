'use client'

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  assignee_name: string | null
  assignee_avatar: string | null
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
}

export default function KanbanCard({
  task,
  dragging,
  canEdit = true,
  onOpen,
}: {
  task: Task
  dragging?: boolean
  canEdit?: boolean
  onOpen?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const dragProps = canEdit ? { ...attributes, ...listeners } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onClick={() => onOpen?.(task.id)}
      className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow ${
        canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${dragging ? "shadow-lg rotate-2" : ""}`}
    >
      <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
          {task.priority}
        </span>

        {task.assignee_name && (
          <div
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
            title={task.assignee_name}
          >
            <span className="text-[10px] font-medium text-gray-600">
              {task.assignee_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {task.due_date && (
        <p className="text-xs text-gray-400 mt-2">
          Due {new Date(task.due_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}