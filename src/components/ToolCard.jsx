import { Star } from 'lucide-react'

export function ToolCard({ tool, icon: Icon, isActive, isFavorite, onSelect, onToggleFavorite }) {
  return (
    <article className={`tool-card ${isActive ? 'is-active' : ''}`}>
      <button type="button" className="tool-card-main" onClick={onSelect} aria-pressed={isActive}>
        <span className="tool-card-icon">{Icon ? <Icon size={20} aria-hidden="true" /> : null}</span>
        <span>
          <span className="tool-card-title">{tool.name}</span>
          <span className="tool-card-meta">
            {tool.category} - {tool.status}
          </span>
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
        <Star size={16} aria-hidden="true" />
      </button>
    </article>
  )
}
