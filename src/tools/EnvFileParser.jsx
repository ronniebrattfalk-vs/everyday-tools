import { useMemo, useState } from 'react'
import { parse } from 'dotenv'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sample = `# Application
APP_NAME=My App
APP_URL=https://example.com
PORT=3000

# Database
DATABASE_URL=postgresql://localhost:5432/myapp
DATABASE_POOL=10

# API keys
STRIPE_SECRET_KEY="sk_test_abc123"
OPENAI_API_KEY='sk-abc...'

# Multiline values
PRIVATE_KEY="-----BEGIN KEY-----
line-1
line-2
-----END KEY-----"

# Feature flags
ENABLE_DARK_MODE=true
DEBUG=false`

function parseEnv(text) {
  try {
    const parsed = parse(text)
    const rows = Object.entries(parsed).map(([key, value]) => ({
      key,
      value,
      masked: /key|secret|token|password/i.test(key),
    }))
    return { rows, error: '' }
  } catch (error) {
    return { rows: [], error: error.message || 'Could not parse .env content' }
  }
}

function toEnvFormat(rows) {
  return rows
    .map(({ key, value }) => {
      const needsQuotes = /[\s"'#\n]/.test(value)
      return `${key}=${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}`
    })
    .join('\n')
}

function toJSON(rows) {
  const obj = Object.fromEntries(rows.map(({ key, value }) => [key, value]))
  return JSON.stringify(obj, null, 2)
}

function toShell(rows) {
  return rows
    .map(({ key, value }) => {
      const needsQuotes = /[\s"'$`\\\n]/.test(value)
      return `export ${key}=${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}`
    })
    .join('\n')
}

function maskValue(value) {
  if (!value) return ''
  if (value.length <= 6) return '••••••'
  return `${value.slice(0, 3)}••••${value.slice(-2)}`
}

const FORMATS = [
  { key: 'env', label: '.env', ext: '.env', mime: 'text/plain' },
  { key: 'json', label: 'JSON', ext: '.json', mime: 'application/json' },
  { key: 'shell', label: 'Shell', ext: '.sh', mime: 'text/plain' },
]

export function EnvFileParser() {
  const [input, setInput] = useState(sample)
  const [format, setFormat] = useState('env')
  const [maskSecrets, setMaskSecrets] = useState(true)
  const [message, setMessage] = useState('')

  const parsed = useMemo(() => parseEnv(input), [input])

  const displayRows = useMemo(() => {
    return parsed.rows.map((row) => ({
      ...row,
      displayValue: maskSecrets && row.masked ? maskValue(row.value) : row.value,
    }))
  }, [maskSecrets, parsed.rows])

  const exported = useMemo(() => {
    if (!parsed.rows.length) return ''
    if (format === 'json') return toJSON(parsed.rows)
    if (format === 'shell') return toShell(parsed.rows)
    return toEnvFormat(parsed.rows)
  }, [parsed.rows, format])

  async function copy() {
    if (!exported) return
    await navigator.clipboard.writeText(exported)
    setMessage('Export copied')
    setTimeout(() => setMessage(''), 1500)
  }

  function download() {
    if (!exported) return
    const nextFormat = FORMATS.find((item) => item.key === format)
    const blob = new Blob([exported], { type: `${nextFormat.mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `env-export${nextFormat.ext}`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage(`Downloaded as ${nextFormat.ext}`)
  }

  function reset() {
    setInput(sample)
    setFormat('env')
    setMaskSecrets(true)
    setMessage('Reset to sample .env')
  }

  return (
    <div className="tool-body env-tool">
      <div className="env-input-panel">
        <div className="section-title-row">
          <h3>Paste .env content</h3>
          <button type="button" className="secondary-button" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        <textarea
          className="env-textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder={'# .env file\nKEY=value\n"QUOTED"="value with spaces"'}
        />

        <div className="env-toggle-row">
          <label className="check-row">
            <input type="checkbox" checked={maskSecrets} onChange={(event) => setMaskSecrets(event.target.checked)} />
            Mask likely secrets in preview
          </label>
        </div>

        <p className="helper-text">
          {parsed.error
            ? `Parse warning: ${parsed.error}`
            : parsed.rows.length
              ? `${parsed.rows.length} variable${parsed.rows.length === 1 ? '' : 's'} parsed with dotenv-compatible rules.`
              : 'Paste a .env file to parse it.'}
        </p>
      </div>

      <div className="env-output-panel">
        {parsed.rows.length > 0 ? (
          <>
            <div className="section-title-row">
              <h3>Variables</h3>
              <span className="json-stat">{displayRows.filter((row) => row.masked).length} likely secrets</span>
            </div>

            <div className="env-var-list">
              {displayRows.map(({ key, displayValue, masked }, index) => (
                <article key={`${key}-${index}`} className={`env-var-row ${masked ? 'env-var-row-masked' : ''}`}>
                  <code className="env-key">{key}</code>
                  <code className="env-value">{displayValue || <em>empty</em>}</code>
                </article>
              ))}
            </div>

            <div className="section-title-row">
              <h3>Export</h3>
              <div className="button-row" style={{ marginTop: 0 }}>
                <button type="button" className="icon-button" onClick={copy} aria-label="Copy export">
                  <Clipboard size={16} aria-hidden="true" />
                </button>
                <button type="button" className="icon-button" onClick={download} aria-label="Download export">
                  <Download size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="category-tabs compact" aria-label="Export format">
              {FORMATS.map(({ key, label }) => (
                <button key={key} type="button" className={format === key ? 'is-active' : ''} onClick={() => setFormat(key)}>
                  {label}
                </button>
              ))}
            </div>

            <textarea className="env-textarea output" value={exported} readOnly spellCheck={false} aria-label="Export output" />

            <p className="helper-text">{message || 'Use masking for safe review, then export the unmodified parsed values.'}</p>
          </>
        ) : (
          <div className="empty-state">
            <p>Parsed variables appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
