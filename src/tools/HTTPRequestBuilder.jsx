import { useMemo, useState } from 'react'
import parseCurl from 'parse-curl'
import { Clipboard, Download, Plus, RotateCcw, Upload, Wand2, Trash2 } from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'text/plain',
  'multipart/form-data',
]
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])
const sampleCurl = `curl -X POST "https://api.example.com/users?source=codex" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Jane Doe","email":"jane@example.com"}'`

function buildCurl(url, method, headers, body, contentType) {
  const parts = [`curl -X ${method} "${url}"`]
  for (const { key, value } of headers) {
    if (key.trim()) parts.push(`  -H "${key.trim()}: ${value}"`)
  }
  if (BODY_METHODS.has(method) && body.trim()) {
    if (contentType && !headers.some((header) => header.key.trim().toLowerCase() === 'content-type')) {
      parts.push(`  -H "Content-Type: ${contentType}"`)
    }
    parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`)
  }
  return parts.join(' \\\n')
}

function buildFetch(url, method, headers, body, contentType) {
  const hdrs = {}
  for (const { key, value } of headers) {
    if (key.trim()) hdrs[key.trim()] = value
  }
  if (BODY_METHODS.has(method) && body.trim() && contentType && !hdrs['Content-Type']) {
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
  if (BODY_METHODS.has(method) && body.trim() && contentType && !hdrs['Content-Type']) {
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

function normalizeHeaders(source) {
  const entries = source ? Object.entries(source) : []
  return entries.length ? entries.map(([key, value]) => ({ key, value: String(value ?? '') })) : [{ key: '', value: '' }]
}

function importCurlCommand(command) {
  const trimmed = command.trim()
  if (!trimmed) return { error: 'Paste a curl command first' }

  try {
    const parsed = parseCurl(trimmed)
    if (!parsed?.url) return { error: 'Could not detect a request URL from that curl command' }

    return {
      error: '',
      method: String(parsed.method || 'GET').toUpperCase(),
      url: parsed.url,
      headers: normalizeHeaders(parsed.header),
      body: parsed.body || '',
      contentType: parsed.header?.['Content-Type'] || 'application/json',
    }
  } catch (error) {
    return { error: error.message || 'Could not parse that curl command' }
  }
}

const TABS = ['curl', 'fetch', 'axios']

export function HTTPRequestBuilder() {
  const [url, setUrl] = useState('https://api.example.com/users')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState([{ key: 'Authorization', value: 'Bearer <token>' }])
  const [body, setBody] = useState('{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}')
  const [contentType, setContentType] = useState('application/json')
  const [tab, setTab] = useState('curl')
  const [curlInput, setCurlInput] = useState(sampleCurl)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  function addHeader() {
    setHeaders((current) => [...current, { key: '', value: '' }])
  }

  function updateHeader(index, field, value) {
    setHeaders((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)))
  }

  function removeHeader(index) {
    setHeaders((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  const snippet = useMemo(() => {
    if (!url.trim()) return '// Enter a URL to generate a snippet.'
    const active = headers.filter((header) => header.key.trim())
    if (tab === 'curl') return buildCurl(url, method, active, body, contentType)
    if (tab === 'fetch') return buildFetch(url, method, active, body, contentType)
    return buildAxios(url, method, active, body, contentType)
  }, [url, method, headers, body, contentType, tab])

  async function copy() {
    await navigator.clipboard.writeText(snippet)
    setMessage('Snippet copied')
  }

  async function copyCurlInput() {
    await navigator.clipboard.writeText(curlInput)
    setMessage('curl input copied')
  }

  async function loadCurlFile(file) {
    if (!file) return
    const text = await file.text()
    setCurlInput(text)
    setMessage(`${file.name} loaded`)
  }

  function applyCurlImport() {
    const imported = importCurlCommand(curlInput)
    if (imported.error) {
      setMessage(imported.error)
      return
    }

    setMethod(imported.method)
    setUrl(imported.url)
    setHeaders(imported.headers)
    setBody(imported.body)
    setContentType(CONTENT_TYPES.includes(imported.contentType) ? imported.contentType : imported.contentType || 'application/json')
    setMessage('curl command imported')
  }

  function downloadSnippet() {
    const extension = tab === 'curl' ? 'sh' : 'txt'
    const blob = new Blob([snippet], { type: 'text/plain' })
    const urlObject = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = urlObject
    link.download = `request-snippet.${extension}`
    link.click()
    URL.revokeObjectURL(urlObject)
    setMessage('Snippet downloaded')
  }

  function resetBuilder() {
    setUrl('https://api.example.com/users')
    setMethod('GET')
    setHeaders([{ key: 'Authorization', value: 'Bearer <token>' }])
    setBody('{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}')
    setContentType('application/json')
    setTab('curl')
    setCurlInput(sampleCurl)
    setMessage('Request builder reset')
  }

  const showBody = BODY_METHODS.has(method)
  const headerCount = headers.filter((header) => header.key.trim()).length

  return (
    <div className="tool-body request-tool">
      <div className="request-controls">
        <div className="section-title-row">
          <h3>Request</h3>
          <span className="json-stat">{method} request</span>
        </div>

        <div className="request-url-row">
          <select value={method} onChange={(event) => setMethod(event.target.value)} aria-label="HTTP method">
            {METHODS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.example.com/endpoint"
            spellCheck={false}
            aria-label="Request URL"
          />
        </div>

        <section
          className={`request-import-panel${isDragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); loadCurlFile(e.dataTransfer.files?.[0]) }}
        >
          <div className="section-title-row">
            <h3>Import curl</h3>
            <div className="button-row">
              <label className="secondary-button file-button">
                <Upload size={16} aria-hidden="true" />
                Open
                <input type="file" accept=".txt,.sh,text/plain" onChange={(event) => loadCurlFile(event.target.files?.[0])} />
              </label>
              <button type="button" className="secondary-button" onClick={copyCurlInput}>
                <Clipboard size={16} aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
          <textarea
            className="request-textarea request-import-textarea"
            value={curlInput}
            onChange={(event) => setCurlInput(event.target.value)}
            spellCheck={false}
            placeholder='Paste a curl command like: curl -X POST "https://api.example.com/users" -H "Authorization: Bearer ..."'
          />
          <button type="button" className="secondary-button" onClick={applyCurlImport}>
            <Wand2 size={17} aria-hidden="true" />
            Import into builder
          </button>
        </section>

        <div>
          <div className="section-title-row request-subsection-title">
            <label>Headers</label>
            <button type="button" className="secondary-button request-add-btn" onClick={addHeader}>
              <Plus size={14} aria-hidden="true" />
              Add
            </button>
          </div>
          <div className="request-header-list">
            {headers.length ? (
              headers.map((row, index) => (
                <div key={`${row.key}-${index}`} className="request-header-row">
                  <input
                    value={row.key}
                    onChange={(event) => updateHeader(index, 'key', event.target.value)}
                    placeholder="Header name"
                    spellCheck={false}
                  />
                  <input
                    value={row.value}
                    onChange={(event) => updateHeader(index, 'value', event.target.value)}
                    placeholder="Value"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => removeHeader(index)}
                    aria-label="Remove header"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))
            ) : (
              <p className="helper-text request-inline-note">No headers. Click Add to include one.</p>
            )}
          </div>
        </div>

        {showBody && (
          <>
            <label>
              Content-Type
              <select value={contentType} onChange={(event) => setContentType(event.target.value)}>
                {[...new Set([...CONTENT_TYPES, contentType])].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Body
              <textarea className="request-textarea" value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} />
            </label>
          </>
        )}

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={resetBuilder}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="request-output">
        <div className="section-title-row">
          <h3>Snippet</h3>
          <button type="button" className="icon-button" onClick={copy} aria-label="Copy snippet">
            <Clipboard size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="diff-stats" aria-live="polite">
          <span>{headerCount} headers</span>
          <span>{showBody && body.trim() ? 'body included' : 'no body'}</span>
          <span>{tab}</span>
        </div>

        <div className="category-tabs compact" aria-label="Snippet format">
          {TABS.map((item) => (
            <button key={item} type="button" className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>

        <textarea className="request-snippet" value={snippet} readOnly spellCheck={false} aria-label="Generated snippet" />

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={downloadSnippet}>
            <Download size={16} aria-hidden="true" />
            Download
          </button>
        </div>

        <p className="helper-text">{message || 'Import curl or build the request manually, then switch tabs to change output format.'}</p>
      </div>
    </div>
  )
}
