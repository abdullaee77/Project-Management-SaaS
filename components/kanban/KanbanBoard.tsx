'use client'

import { useState } from "react"
import FilterBar from "./FilterBar"
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
import TaskModal from "@/components/tasks/TaskModal"

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
]

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
const [priorityFilter, setPriorityFilter] = useState("")
const [assigneeFilter, setAssigneeFilter] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

const getColumnTasks = (status: string) => {
  return tasks
    .filter((t) => t.status === status)
    .filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (priorityFilter && t.priority !== priorityFilter) return false
      if (assigneeFilter === "unassigned" && t.assignee_id) return false
      if (assigneeFilter && assigneeFilter !== "unassigned" && t.assignee_id !== assigneeFilter) return false
      return true
    })
    .sort((a, b) => a.position - b.position)
}

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const isOverColumn = over.data.current?.isColumn === true
    const overTask = isOverColumn ? null : tasks.find((t) => t.id === over.id)
    const newStatus = isOverColumn ? (over.id as string) : (overTask?.status ?? draggedTask.status)

    if (draggedTask.status === newStatus && draggedTask.id === over.id) return

    let updated = tasks.filter((t) => t.id !== draggedTask.id)
    const moved = { ...draggedTask, status: newStatus }

    if (overTask) {
      const overIndex = updated.findIndex((t) => t.id === overTask.id)
      updated.splice(overIndex, 0, moved)
    } else {
      updated.push(moved)
    }

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

  const handleTaskUpdate = (taskId: string, fields: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...fields } : t)))
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }
  const handleClearFilters = () => {
  setSearch("")
  setPriorityFilter("")
  setAssigneeFilter("")
}

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null

 return (
    <>
      <FilterBar
        members={members}
        search={search}
        setSearch={setSearch}
        priority={priorityFilter}
        setPriority={setPriorityFilter}
        assignee={assigneeFilter}
        setAssignee={setAssigneeFilter}
        onClear={handleClearFilters}
      />

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
              onOpenTask={setSelectedTaskId}
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

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          canEdit={canEdit}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </>
  )
}
