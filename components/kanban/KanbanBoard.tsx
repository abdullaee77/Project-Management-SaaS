'use client'

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import KanbanColumn from "./KanbanColumn"
import KanbanCard from "./KanbanCard"
import TaskForm from "@/components/tasks/TaskForm"

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
]

interface Task {
  id: string
  title: string
  status: string
  priority: string
  position: number
  due_date: string | null
  assignee_id: string | null
  assignee_name: string | null
  assignee_avatar: string | null
}

interface Member {
  id: string
  name: string
  avatar: string | null
}

export default function KanbanBoard({
  projectId,
  initialTasks,
  members,
  canEdit,
}: {
  projectId: string
  initialTasks: Task[]
  members: Member[]
  canEdit: boolean
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const getColumnTasks = (status: string) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    const isOverColumn = over.data.current?.isColumn === true
    const overTask = isOverColumn ? null : tasks.find((t) => t.id === over.id)
    const newStatus = isOverColumn ? (over.id as string) : (overTask?.status ?? activeTask.status)

    // Dropped on itself with no status change — nothing to do
    if (activeTask.status === newStatus && activeTask.id === over.id) return

    // Remove the dragged task from the list, then reinsert it at the new spot
    let updated = tasks.filter((t) => t.id !== activeTask.id)
    const moved = { ...activeTask, status: newStatus }

    if (overTask) {
      const overIndex = updated.findIndex((t) => t.id === overTask.id)
      updated.splice(overIndex, 0, moved)
    } else {
      updated.push(moved)
    }

    // Recalculate position (0, 1, 2...) for every column
    const changedTasks: { id: string; status: string; position: number }[] = []
    COLUMNS.forEach((col) => {
      const colTasks = updated.filter((t) => t.status === col.id)
      colTasks.forEach((t, index) => {
        const original = tasks.find((x) => x.id === t.id)
        if (!original || original.position !== index || original.status !== col.id) {
          changedTasks.push({ id: t.id, status: col.id, position: index })
        }
        t.position = index
      })
    })

    setTasks(updated)

    if (changedTasks.length > 0) {
      await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: changedTasks }),
      })
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask])
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={getColumnTasks(col.id)}
            canEdit={canEdit}
          >
            {canEdit && (
              <TaskForm
                projectId={projectId}
                status={col.id}
                members={members}
                onCreated={handleTaskCreated}
              />
            )}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}