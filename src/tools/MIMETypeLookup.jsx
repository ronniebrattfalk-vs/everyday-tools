import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const mimeTypes = [
  ['.aac', 'audio/aac', 'AAC audio'],
  ['.avif', 'image/avif', 'AVIF image'],
  ['.csv', 'text/csv', 'Comma-separated values'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word document'],
  ['.gif', 'image/gif', 'GIF image'],
  ['.html', 'text/html', 'HTML document'],
  ['.ico', 'image/vnd.microsoft.icon', 'Icon file'],
  ['.ics', 'text/calendar', 'Calendar file'],
  ['.jpeg', 'image/jpeg', 'JPEG image'],
  ['.jpg', 'image/jpeg', 'JPEG image'],
  ['.js', 'text/javascript', 'JavaScript'],
  ['.json', 'application/json', 'JSON data'],
  ['.md', 'text/markdown', 'Markdown document'],
  ['.mp3', 'audio/mpeg', 'MP3 audio'],
  ['.mp4', 'video/mp4', 'MP4 video'],
  ['.pdf', 'application/pdf', 'PDF document'],
  ['.png', 'image/png', 'PNG image'],
  ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PowerPoint presentation'],
  ['.svg', 'image/svg+xml', 'SVG image'],
  ['.txt', 'text/plain', 'Plain text'],
  ['.webm', 'video/webm', 'WebM video'],
  ['.webp', 'image/webp', 'WebP image'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel spreadsheet'],
  ['.xml', 'application/xml', 'XML document'],
  ['.zip', 'application/zip', 'ZIP archive'],
].map(([extension, type, description]) => ({ extension, type, description }))

export function MIMETypeLookup() {
  const [query, setQuery] = useState('.json')
  const [message, setMessage] = useState('')

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return mimeTypes
    return mimeTypes.filter((item) => `${item.extension} ${item.type} ${item.description}`.toLowerCase().includes(normalized))
  }, [query])

  async function copyType(item) {
    await navigator.clipboard.writeText(item.type)
    setMessage(`${item.extension} MIME type copied`)
  }

  function resetTool() {
    setQuery('.json')
    setMessage('Reset MIME lookup')
  }

  return (
    <div className="tool-body lookup-tool">
      <section className="lookup-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Files</p>
            <h3>MIME type lookup</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Search extension, type, or description
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <p className="helper-text">{message || `${matches.length} matching MIME types`}</p>
      </section>

      <section className="lookup-results">
        {matches.map((item) => (
          <article key={`${item.extension}-${item.type}`}>
            <div>
              <span>{item.description}</span>
              <strong>{item.extension}</strong>
              <p>{item.type}</p>
            </div>
            <button type="button" className="icon-button" onClick={() => copyType(item)} aria-label={`Copy ${item.extension} MIME type`}>
              <Clipboard size={16} aria-hidden="true" />
            </button>
          </article>
        ))}
        {matches.length === 0 && (
          <div className="empty-state">
            <p>No matching MIME types.</p>
          </div>
        )}
      </section>
    </div>
  )
}
