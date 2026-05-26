import { useMemo, useState } from 'react'
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

# Feature flags
ENABLE_DARK_MODE=true
DEBUG=false`

function parseEnv(text) {
  const rows = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) rows.push({ key, value })
  }
  return rows
}

function toEnvFormat(rows) {
  return rows
    .map(({ key, value }) => {
      const needsQuotes = /[\s"'#]/.test(value)
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
      const needsQuotes = /[\s"'$`\\]/.test(value)
      return `export ${key}=${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}`
    })
    .join('\n')
}

const FORMATS = [
  { key: 'env', label: '.env', ext: '.env', mime: 'text/plain' },
  { key: 'json', label: 'JSON', ext: '.json', mime: 'application/json' },
  { key: 'shell', label: 'Shell', ext: '.sh', mime: 'text/plain' },
]

export function EnvFileParser() {
  const [input, setInput] = useState(sample)
  const [format, setFormat] = useState('env')
  const [message, setMessage] = useState('')

  const rows = useMemo(() => parseEnv(input), [input])

  const exported = useMemo(() => {
    if (!rows.length) return ''
    if (format === 'json') return toJSON(rows)
    if (format === 'shell') return toShell(rows)
    return toEnvFormat(rows)
  }, [rows, format])

  async function copy() {
    if (!exported) return
    await navigator.clipboard.writeText(exported)
    setMessage('Export copied')
    setTimeout(() => setMessage(''), 1500)
  }

  function download() {
    if (!exported) return
    const fmt = FORMATS.find((f) => f.key === format)
    const blob = new Blob([exported], { type: `${fmt.mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `env-export${fmt.ext}`
    a.click()
    URL.revokeObjectURL(url)
    setMessage(`Downloaded as ${fmt.ext}`)
  }

  return (
    <div className="tool-body env-tool">
      <div className="env-input-panel">
        <div className="section-title-row">
          <h3>Paste .env content</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setInput('')
              setMessage('Cleared')
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Clear
          </button>
        </div>

        <textarea
          className="env-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder={'# .env file\nKEY=value\n"QUOTED"="value with spaces"'}
        />

        <p className="helper-text">
          {rows.length
            ? `${rows.length} variable${rows.length === 1 ? '' : 's'} parsed. Comments and blank lines are ignored.`
            : 'Paste a .env file to parse it.'}
        </p>
      </div>

      <div className="env-output-panel">
        {rows.length > 0 ? (
          <>
            <div className="section-title-row">
              <h3>Variables</h3>
            </div>

            <div className="env-var-list">
              {rows.map(({ key, value }, i) => (
                <article key={`${key}-${i}`} className="env-var-row">
                  <code className="env-key">{key}</code>
                  <code className="env-value">{value || <em>empty</em>}</code>
                </article>
              ))}
            </div>

            <div className="section-title-row">
              <h3>Export</h3>
              <div className="button-row" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="icon-button"
                  onClick={copy}
                  aria-label="Copy export"
                >
                  <Clipboard size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={download}
                  aria-label="Download export"
                >
                  <Download size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="category-tabs compact" aria-label="Export format">
              {FORMATS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={format === key ? 'is-active' : ''}
                  onClick={() => setFormat(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              className="env-textarea output"
              value={exported}
              readOnly
              spellCheck={false}
              aria-label="Export output"
            />

            <p className="helper-text">{message}</p>
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
