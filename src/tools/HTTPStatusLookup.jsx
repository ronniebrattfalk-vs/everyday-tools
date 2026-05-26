import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const statuses = [
  [100, 'Continue', 'Informational', 'Client can continue the request.'],
  [200, 'OK', 'Success', 'Request succeeded.'],
  [201, 'Created', 'Success', 'Resource was created successfully.'],
  [204, 'No Content', 'Success', 'Request succeeded without a response body.'],
  [301, 'Moved Permanently', 'Redirect', 'Resource has a permanent new URL.'],
  [302, 'Found', 'Redirect', 'Temporary redirect, often used after form submissions.'],
  [304, 'Not Modified', 'Redirect', 'Cached copy is still valid.'],
  [400, 'Bad Request', 'Client Error', 'Request syntax or parameters are invalid.'],
  [401, 'Unauthorized', 'Client Error', 'Authentication is missing or invalid.'],
  [403, 'Forbidden', 'Client Error', 'Authenticated client is not allowed to access the resource.'],
  [404, 'Not Found', 'Client Error', 'Resource does not exist at this URL.'],
  [409, 'Conflict', 'Client Error', 'Request conflicts with current resource state.'],
  [422, 'Unprocessable Content', 'Client Error', 'Validation failed even though the request syntax was valid.'],
  [429, 'Too Many Requests', 'Client Error', 'Rate limit or quota has been exceeded.'],
  [500, 'Internal Server Error', 'Server Error', 'Server failed unexpectedly.'],
  [502, 'Bad Gateway', 'Server Error', 'Gateway received an invalid upstream response.'],
  [503, 'Service Unavailable', 'Server Error', 'Server is overloaded or down for maintenance.'],
  [504, 'Gateway Timeout', 'Server Error', 'Gateway did not receive an upstream response in time.'],
].map(([code, name, group, note]) => ({ code, name, group, note }))

export function HTTPStatusLookup() {
  const [query, setQuery] = useState('404')
  const [message, setMessage] = useState('')

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return statuses
    return statuses.filter((status) =>
      `${status.code} ${status.name} ${status.group} ${status.note}`.toLowerCase().includes(normalized),
    )
  }, [query])

  async function copyStatus(status) {
    await navigator.clipboard.writeText(`${status.code} ${status.name} - ${status.note}`)
    setMessage(`${status.code} copied`)
  }

  function resetTool() {
    setQuery('404')
    setMessage('Reset status lookup')
  }

  return (
    <div className="tool-body lookup-tool">
      <section className="lookup-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">HTTP</p>
            <h3>Status lookup</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Search code, name, or note
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <p className="helper-text">{message || `${matches.length} matching statuses`}</p>
      </section>

      <section className="lookup-results">
        {matches.map((status) => (
          <article key={status.code}>
            <div>
              <span>{status.group}</span>
              <strong>
                {status.code} {status.name}
              </strong>
              <p>{status.note}</p>
            </div>
            <button type="button" className="icon-button" onClick={() => copyStatus(status)} aria-label={`Copy ${status.code}`}>
              <Clipboard size={16} aria-hidden="true" />
            </button>
          </article>
        ))}
        {matches.length === 0 && (
          <div className="empty-state">
            <p>No matching HTTP status codes.</p>
          </div>
        )}
      </section>
    </div>
  )
}
