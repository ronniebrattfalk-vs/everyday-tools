import { useMemo, useState } from 'react'
import { format } from 'sql-formatter'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const DIALECTS = [
  { value: 'sql', label: 'SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'T-SQL' },
  { value: 'bigquery', label: 'BigQuery' },
]

const SAMPLE = `select u.id, u.name, u.email, count(o.id) as order_count, sum(o.total) as total_spent from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= '2024-01-01' and u.role in ('admin','user') group by u.id, u.name, u.email having count(o.id) > 0 order by total_spent desc limit 20;`

export function SQLFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [dialect, setDialect] = useState('sql')
  const [casing, setCasing] = useState('upper')
  const [indentWidth, setIndentWidth] = useState(2)
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const output = useMemo(() => {
    if (!input.trim()) return { sql: '' }
    try {
      const sql = format(input, {
        language: dialect,
        keywordCase: casing === 'preserve' ? 'preserve' : casing,
        indentStyle: 'standard',
        tabWidth: indentWidth,
        linesBetweenQueries: 1,
      })
      return { sql }
    } catch (e) {
      return { error: e.message }
    }
  }, [input, dialect, casing, indentWidth])

  async function copyOutput() {
    if (!output.sql) return
    await navigator.clipboard.writeText(output.sql)
    flash('Copied')
  }

  function downloadOutput() {
    if (!output.sql) return
    const blob = new Blob([output.sql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.sql'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="tool-body sql-tool">
      <div className="sql-left">
        <div className="section-title-row">
          <span className="section-title">SQL input</span>
          <button type="button" className="secondary-button" onClick={() => setInput('')}>
            <RotateCcw size={16} aria-hidden="true" />
            Clear
          </button>
        </div>

        <textarea
          className="sql-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste SQL here…"
        />

        <div className="sql-options">
          <label className="sql-option-label">
            Dialect
            <select
              className="sql-select"
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>

          <label className="sql-option-label">
            Keywords
            <div className="category-tabs compact">
              {[['upper', 'UPPER'], ['lower', 'lower'], ['preserve', 'Preserve']].map(([val, label]) => (
                <button
                  key={val}
                  className={casing === val ? 'active' : ''}
                  onClick={() => setCasing(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          <label className="sql-option-label">
            Indent
            <div className="category-tabs compact">
              {[2, 4].map((w) => (
                <button
                  key={w}
                  className={indentWidth === w ? 'active' : ''}
                  onClick={() => setIndentWidth(w)}
                >
                  {w} spaces
                </button>
              ))}
            </div>
          </label>
        </div>
      </div>

      <div className="sql-right">
        <div className="section-title-row">
          <span className="section-title">Formatted output</span>
          <div className="button-row" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="secondary-button"
              onClick={copyOutput}
              disabled={!output.sql}
            >
              <Clipboard size={16} aria-hidden="true" />
              Copy
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={downloadOutput}
              disabled={!output.sql}
            >
              <Download size={16} aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        {output.error ? (
          <p className="helper-text" style={{ color: 'var(--color-error)' }}>Error: {output.error}</p>
        ) : output.sql ? (
          <pre className="sql-output">{output.sql}</pre>
        ) : (
          <div className="empty-state"><p>Paste SQL above to format it.</p></div>
        )}
      </div>

      <p className="helper-text sql-footer">{message || ' '}</p>
    </div>
  )
}
