import Link from "next/link"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    color: string
    task_count: string | number
    completed_count: string | number
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const total = Number(project.task_count) || 0
  const completed = Number(project.completed_count) || 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Link
      href={`/projects/${project.id}`}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
        <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{completed} / {total} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: project.color }}
          />
        </div>
      </div>
    </Link>
  )
}