import { useMemo, useState } from 'react'
import { diffLines } from 'diff'
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

function buildDiffRows(original, formatted) {
  return diffLines(original, formatted).flatMap((part) => {
    const lines = part.value.split('\n')
    if (lines.at(-1) === '') lines.pop()

    return lines.map((line, index) => ({
      id: `${part.added ? 'add' : part.removed ? 'remove' : 'same'}-${index}-${line}`,
      type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
      value: line || ' ',
    }))
  })
}

export function SQLFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [dialect, setDialect] = useState('sql')
  const [casing, setCasing] = useState('upper')
  const [indentWidth, setIndentWidth] = useState(2)
  const [message, setMessage] = useState('')

  function flash(nextMessage) {
    setMessage(nextMessage)
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
    } catch (error) {
      return { error: error.message }
    }
  }, [input, dialect, casing, indentWidth])

  const diffRows = useMemo(() => {
    if (!output.sql || !input.trim()) return []
    return buildDiffRows(input, output.sql)
  }, [input, output.sql])

  const diffStats = useMemo(() => {
    return {
      added: diffRows.filter((row) => row.type === 'added').length,
      removed: diffRows.filter((row) => row.type === 'removed').length,
      unchanged: diffRows.filter((row) => row.type === 'unchanged').length,
    }
  }, [diffRows])

  async function copyOutput() {
    if (!output.sql) return
    await navigator.clipboard.writeText(output.sql)
    flash('Copied')
  }

  function downloadOutput() {
    if (!output.sql) return
    const blob = new Blob([output.sql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'formatted.sql'
    anchor.click()
    URL.revokeObjectURL(url)
    flash('Downloaded')
  }

  function resetFormatter() {
    setInput(SAMPLE)
    setDialect('sql')
    setCasing('upper')
    setIndentWidth(2)
    flash('Reset')
  }

  return (
    <div className="tool-body sql-tool">
      <div className="sql-left">
        <div className="section-title-row">
          <span className="section-title">SQL input</span>
          <button type="button" className="secondary-button" onClick={resetFormatter}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        <textarea
          className="sql-textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Paste SQL here..."
        />

        <div className="sql-options">
          <label className="sql-option-label">
            Dialect
            <select className="sql-select" value={dialect} onChange={(event) => setDialect(event.target.value)}>
              {DIALECTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sql-option-label">
            Keywords
            <div className="category-tabs compact">
              {[
                ['upper', 'UPPER'],
                ['lower', 'lower'],
                ['preserve', 'Preserve'],
              ].map(([value, label]) => (
                <button key={value} type="button" className={casing === value ? 'is-active' : ''} onClick={() => setCasing(value)}>
                  {label}
                </button>
              ))}
            </div>
          </label>

          <label className="sql-option-label">
            Indent
            <div className="category-tabs compact">
              {[2, 4].map((width) => (
                <button
                  key={width}
                  type="button"
                  className={indentWidth === width ? 'is-active' : ''}
                  onClick={() => setIndentWidth(width)}
                >
                  {width} spaces
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
            <button type="button" className="secondary-button" onClick={copyOutput} disabled={!output.sql}>
              <Clipboard size={16} aria-hidden="true" />
              Copy
            </button>
            <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output.sql}>
              <Download size={16} aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        {output.error ? (
          <p className="helper-text sql-error">Error: {output.error}</p>
        ) : output.sql ? (
          <>
            <pre className="sql-output">{output.sql}</pre>

            <div className="section-title-row">
              <span className="section-title">Formatting diff</span>
              <span className="json-stat">
                {diffStats.added} added lines, {diffStats.removed} removed lines
              </span>
            </div>

            <div className="sql-diff-panel">
              {diffRows.map((row) => (
                <div key={row.id} className={`sql-diff-row sql-diff-${row.type}`}>
                  <span>{row.type === 'added' ? '+' : row.type === 'removed' ? '−' : '·'}</span>
                  <code>{row.value}</code>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Paste SQL above to format it.</p>
          </div>
        )}
      </div>

      <p className="helper-text sql-footer">{message || 'Format SQL and review the line-by-line normalization diff.'}</p>
    </div>
  )
}
