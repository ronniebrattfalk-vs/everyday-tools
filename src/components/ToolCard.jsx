import { Star } from 'lucide-react'

export function ToolCard({ tool, icon: Icon, isActive, isFavorite, onSelect, onToggleFavorite, categoryColor }) {
  const color = categoryColor ?? '#7c6ef4'
  return (
    <article className={`tool-card ${isActive ? 'is-active' : ''}`}>
      <button type="button" className="tool-card-main" onClick={onSelect} aria-pressed={isActive}>
        <span
          className="tool-card-icon"
          style={{ background: `${color}33`, color }}
        >
          {Icon ? <Icon size={18} aria-hidden="true" /> : null}
          {tool.updated && <span className="tool-card-updated-dot" aria-label="Recently updated" />}
        </span>
        <span>
          <span className="tool-card-title">{tool.name}</span>
          <span className="tool-card-meta">{tool.category}</span>
        </span>
      </button>
      <button
        type="button"
        className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
        onClick={() => onToggleFavorite(tool.slug)}
        aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={14} aria-hidden="true" />
      </button>
    </article>
  )
}
