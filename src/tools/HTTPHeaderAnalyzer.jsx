import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleHeaders = `HTTP/2 200
content-type: text/html; charset=utf-8
cache-control: public, max-age=3600
content-encoding: br
access-control-allow-origin: https://example.com
location: https://example.com/new-page
strict-transport-security: max-age=31536000; includeSubDomains`

function parseHeaders(value) {
  return value.split(/\r?\n/).reduce((headers, line) => {
    if (/^HTTP\//i.test(line.trim())) {
      headers.status = line.trim()
      return headers
    }
    const index = line.indexOf(':')
    if (index === -1) return headers
    headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim()
    return headers
  }, {})
}

function analyzeHeaders(headers) {
  return [
    {
      label: 'Status',
      ok: Boolean(headers.status),
      value: headers.status || 'No status line pasted',
      note: 'Useful when copying complete response headers from a browser or API client.',
    },
    {
      label: 'Cache',
      ok: Boolean(headers['cache-control']),
      value: headers['cache-control'] || 'Missing',
      note: headers['cache-control']?.includes('no-store') ? 'Prevents storage of sensitive responses.' : 'Check max-age, public/private, and no-store settings.',
    },
    {
      label: 'Redirect',
      ok: Boolean(headers.location),
      value: headers.location || 'No Location header',
      note: 'Location matters for 3xx redirects and some 201 Created responses.',
    },
    {
      label: 'CORS',
      ok: Boolean(headers['access-control-allow-origin']),
      value: headers['access-control-allow-origin'] || 'Missing',
      note: headers['access-control-allow-origin'] === '*' ? 'Wildcard CORS can be risky with credentials.' : 'Specific origins are usually easier to reason about.',
    },
    {
      label: 'Compression',
      ok: Boolean(headers['content-encoding']),
      value: headers['content-encoding'] || 'Missing',
      note: 'br and gzip are common compression encodings.',
    },
    {
      label: 'Security',
      ok: Boolean(headers['strict-transport-security'] || headers['content-security-policy']),
      value: headers['strict-transport-security'] || headers['content-security-policy'] || 'Missing',
      note: 'Security headers overlap with the dedicated checklist tool.',
    },
  ]
}

export function HTTPHeaderAnalyzer() {
  const [input, setInput] = useState(sampleHeaders)
  const [message, setMessage] = useState('')
  const headers = useMemo(() => parseHeaders(input), [input])
  const findings = useMemo(() => analyzeHeaders(headers), [headers])
  const presentCount = findings.filter((finding) => finding.ok).length

  async function copySummary() {
    const summary = findings.map((finding) => `${finding.label}: ${finding.value} - ${finding.note}`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Header analysis copied')
  }

  function resetTool() {
    setInput(sampleHeaders)
    setMessage('Reset header analyzer')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">HTTP</p>
            <h3>Header analyzer</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Response headers
          <textarea className="headers-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy analysis
        </button>

        <p className="helper-text">{message || `${presentCount} of ${findings.length} areas detected`}</p>
      </section>

      <section className="headers-results">
        {findings.map((finding) => (
          <article key={finding.label} className={finding.ok ? 'passes' : 'fails'}>
            <span>{finding.ok ? 'Detected' : 'Missing'}</span>
            <strong>{finding.label}</strong>
            <code>{finding.value}</code>
            <p>{finding.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
