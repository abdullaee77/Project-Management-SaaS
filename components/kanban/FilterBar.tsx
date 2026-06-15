'use client'

interface Member {
  id: string
  name: string
  avatar: string | null
}

interface FilterBarProps {
  members: Member[]
  search: string
  setSearch: (value: string) => void
  priority: string
  setPriority: (value: string) => void
  assignee: string
  setAssignee: (value: string) => void
  onClear: () => void
}

export default function FilterBar({
  members,
  search,
  setSearch,
  priority,
  setPriority,
  assignee,
  setAssignee,
  onClear,
}: FilterBarProps) {
  const hasFilters = search || priority || assignee

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48"
        />
      </div>

      {/* Priority */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-600"
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      {/* Assignee */}
      <select
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-600"
      >
        <option value="">Everyone</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-gray-600 px-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}