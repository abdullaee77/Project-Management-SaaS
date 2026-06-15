'use client'

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import KanbanCard from "./KanbanCard"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  assignee_name: string | null
  assignee_avatar: string | null
}

interface KanbanColumnProps {
  id: string
  label: string
  tasks: Task[]
  canEdit: boolean
  children?: React.ReactNode
}

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#10b981",
}

export default function KanbanColumn({ id, label, tasks, canEdit, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { isColumn: true },
  })

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[id] }} />
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="text-xs text-gray-400">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 space-y-2 min-h-[120px] transition-colors ${
          isOver ? "bg-blue-50" : "bg-gray-100"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} canEdit={canEdit} />
          ))}
        </SortableContext>

        {children}
      </div>
    </div>
  )
}