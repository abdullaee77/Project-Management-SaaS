import Link from "next/link"

interface ProjectHeaderProps {
  project: {
    id: string
    workspace_id: string
    name: string
    description: string | null
    color: string
  }
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <header className="bg-gray-300 border-b border-gray-300 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
        <div>
          <h1 className="font-semibold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-gray-400">{project.description}</p>
          )}
        </div>
      </div>
      <Link
        href={`/workspace/${project.workspace_id}`}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Back to projects
      </Link>
    </header>
  )
}