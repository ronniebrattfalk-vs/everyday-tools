import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleHeaders = `content-security-policy: default-src 'self'
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=()
x-content-type-options: nosniff`

const checks = [
  ['content-security-policy', 'CSP', 'Controls allowed script, style, image, and connection sources.'],
  ['strict-transport-security', 'HSTS', 'Forces HTTPS on future visits.'],
  ['x-frame-options', 'Frame protection', 'Reduces clickjacking risk for legacy browser support.'],
  ['referrer-policy', 'Referrer policy', 'Limits referrer data sent to other sites.'],
  ['permissions-policy', 'Permissions policy', 'Restricts browser features such as camera and microphone.'],
  ['x-content-type-options', 'Content sniffing', 'Use nosniff to prevent MIME sniffing surprises.'],
]

function parseHeaders(value) {
  return value.split(/\r?\n/).reduce((headers, line) => {
    const separator = line.indexOf(':')
    if (separator === -1) return headers
    const key = line.slice(0, separator).trim().toLowerCase()
    const headerValue = line.slice(separator + 1).trim()
    if (key) headers[key] = headerValue
    return headers
  }, {})
}

export function SecurityHeadersChecklist() {
  const [input, setInput] = useState(sampleHeaders)
  const [message, setMessage] = useState('')
  const headers = useMemo(() => parseHeaders(input), [input])
  const results = useMemo(
    () =>
      checks.map(([key, label, note]) => ({
        key,
        label,
        note,
        present: Boolean(headers[key]),
        value: headers[key] || 'Missing',
      })),
    [headers],
  )
  const score = results.filter((item) => item.present).length

  async function copySummary() {
    const summary = results.map((item) => `${item.present ? 'PASS' : 'MISS'} ${item.label}: ${item.value}`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Header checklist copied')
  }

  function resetTool() {
    setInput(sampleHeaders)
    setMessage('Reset security header checklist')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Security</p>
            <h3>Header checklist</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Paste response headers
          <textarea className="headers-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy checklist
        </button>

        <p className="helper-text">{message || `${score} of ${results.length} recommended headers present`}</p>
      </section>

      <section className="headers-results">
        {results.map((item) => (
          <article key={item.key} className={item.present ? 'passes' : 'fails'}>
            <span>{item.present ? 'Present' : 'Missing'}</span>
            <strong>{item.label}</strong>
            <code>{item.value}</code>
            <p>{item.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
