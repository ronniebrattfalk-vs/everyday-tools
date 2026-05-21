export function ToolCard({ tool, icon: Icon, isActive, onSelect }) {
  return (
    <button
      type="button"
      className={`tool-card ${isActive ? 'is-active' : ''}`}
      onClick={onSelect}
      aria-pressed={isActive}
    >
      <span className="tool-card-icon">{Icon ? <Icon size={20} aria-hidden="true" /> : null}</span>
      <span>
        <span className="tool-card-title">{tool.name}</span>
        <span className="tool-card-meta">
          {tool.category} · {tool.status}
        </span>
      </span>
    </button>
  )
}
