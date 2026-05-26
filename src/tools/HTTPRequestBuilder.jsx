import { useMemo, useState } from 'react'
import { Clipboard, Plus, Trash2 } from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'text/plain',
  'multipart/form-data',
]
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])

function buildCurl(url, method, headers, body, contentType) {
  const parts = [`curl -X ${method} "${url}"`]
  for (const { key, value } of headers) {
    if (key.trim()) parts.push(`  -H "${key.trim()}: ${value}"`)
  }
  if (BODY_METHODS.has(method) && body.trim()) {
    if (contentType) parts.push(`  -H "Content-Type: ${contentType}"`)
    parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`)
  }
  return parts.join(' \\\n')
}

function buildFetch(url, method, headers, body, contentType) {
  const hdrs = {}
  for (const { key, value } of headers) {
    if (key.trim()) hdrs[key.trim()] = value
  }
  if (BODY_METHODS.has(method) && body.trim() && contentType) {
    hdrs['Content-Type'] = contentType
  }
  const opts = { method }
  if (Object.keys(hdrs).length) opts.headers = hdrs
  if (BODY_METHODS.has(method) && body.trim()) opts.body = body
  return `const response = await fetch("${url}", ${JSON.stringify(opts, null, 2)});\nconst data = await response.json();`
}

function buildAxios(url, method, headers, body, contentType) {
  const hdrs = {}
  for (const { key, value } of headers) {
    if (key.trim()) hdrs[key.trim()] = value
  }
  if (BODY_METHODS.has(method) && body.trim() && contentType) {
    hdrs['Content-Type'] = contentType
  }
  const config = Object.keys(hdrs).length ? { headers: hdrs } : null
  const configStr = config ? `, ${JSON.stringify(config, null, 2)}` : ''
  const m = method.toLowerCase()
  if (BODY_METHODS.has(method) && body.trim()) {
    return `const { data } = await axios.${m}(\n  "${url}",\n  ${body}${configStr}\n);`
  }
  return `const { data } = await axios.${m}("${url}"${configStr});`
}

const TABS = ['curl', 'fetch', 'axios']

export function HTTPRequestBuilder() {
  const [url, setUrl] = useState('https://api.example.com/users')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState([{ key: 'Authorization', value: 'Bearer <token>' }])
  const [body, setBody] = useState('{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}')
  const [contentType, setContentType] = useState('application/json')
  const [tab, setTab] = useState('curl')
  const [message, setMessage] = useState('')

  function addHeader() {
    setHeaders((h) => [...h, { key: '', value: '' }])
  }

  function updateHeader(i, field, value) {
    setHeaders((h) => h.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  function removeHeader(i) {
    setHeaders((h) => h.filter((_, idx) => idx !== i))
  }

  const snippet = useMemo(() => {
    if (!url.trim()) return '// Enter a URL to generate a snippet.'
    const active = headers.filter((h) => h.key.trim())
    if (tab === 'curl') return buildCurl(url, method, active, body, contentType)
    if (tab === 'fetch') return buildFetch(url, method, active, body, contentType)
    return buildAxios(url, method, active, body, contentType)
  }, [url, method, headers, body, contentType, tab])

  async function copy() {
    await navigator.clipboard.writeText(snippet)
    setMessage('Snippet copied')
    setTimeout(() => setMessage(''), 1500)
  }

  const showBody = BODY_METHODS.has(method)

  return (
    <div className="tool-body request-tool">
      <div className="request-controls">
        <div className="section-title-row">
          <h3>Request</h3>
        </div>

        <div className="request-url-row">
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="HTTP method">
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            spellCheck={false}
            aria-label="Request URL"
          />
        </div>

        <div>
          <div className="section-title-row" style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 720 }}>Headers</label>
            <button type="button" className="secondary-button request-add-btn" onClick={addHeader}>
              <Plus size={14} aria-hidden="true" />
              Add
            </button>
          </div>
          <div className="request-header-list">
            {headers.length > 0 ? (
              headers.map((row, i) => (
                <div key={i} className="request-header-row">
                  <input
                    value={row.key}
                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                    placeholder="Header name"
                    spellCheck={false}
                  />
                  <input
                    value={row.value}
                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                    placeholder="Value"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => removeHeader(i)}
                    aria-label="Remove header"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))
            ) : (
              <p className="helper-text" style={{ margin: 0 }}>No headers. Click Add to include one.</p>
            )}
          </div>
        </div>

        {showBody && (
          <>
            <label>
              Content-Type
              <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </label>
            <label>
              Body
              <textarea
                className="request-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
              />
            </label>
          </>
        )}
      </div>

      <div className="request-output">
        <div className="section-title-row">
          <h3>Snippet</h3>
          <button type="button" className="icon-button" onClick={copy} aria-label="Copy snippet">
            <Clipboard size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Snippet format">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? 'is-active' : ''}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          className="request-snippet"
          value={snippet}
          readOnly
          spellCheck={false}
          aria-label="Generated snippet"
        />

        <p className="helper-text">{message || 'Snippet updates as you type. Switch tabs to change format.'}</p>
      </div>
    </div>
  )
}
