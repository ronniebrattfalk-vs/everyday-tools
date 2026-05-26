import { useCallback, useState } from 'react'
import { Clipboard, Download, Minus, Plus, RotateCcw } from 'lucide-react'

const DEFAULT_ROWS = 3
const DEFAULT_COLS = 3
const MAX_ROWS = 20
const MAX_COLS = 10

function makeGrid(rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (r === 0 ? `Header ${c + 1}` : ''))
  )
}

function buildMarkdown(grid) {
  if (!grid.length) return ''
  const cols = grid[0].length
  const pad = (cell) => ` ${cell} `
  const colWidths = Array.from({ length: cols }, (_, c) =>
    Math.max(3, ...grid.map((row) => (row[c] ?? '').length + 2))
  )

  function formatRow(cells) {
    return '|' + cells.map((cell, c) => (` ${cell} `).padEnd(colWidths[c])).join('|') + '|'
  }

  const header = formatRow(grid[0])
  const divider = '|' + colWidths.map((w) => '-'.repeat(w)).join('|') + '|'
  const body = grid.slice(1).map(formatRow)

  return [header, divider, ...body].join('\n')
  void pad
}

export function MarkdownTableBuilder() {
  const [grid, setGrid] = useState(() => makeGrid(DEFAULT_ROWS, DEFAULT_COLS))
  const [message, setMessage] = useState('')

  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const updateCell = useCallback((r, c, value) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = value
      return next
    })
  }, [])

  function addRow() {
    if (rows >= MAX_ROWS) return
    setGrid((prev) => [...prev, Array(cols).fill('')])
  }

  function removeRow() {
    if (rows <= 2) return
    setGrid((prev) => prev.slice(0, -1))
  }

  function addCol() {
    if (cols >= MAX_COLS) return
    const newIndex = cols + 1
    setGrid((prev) => prev.map((row, r) => [...row, r === 0 ? `Header ${newIndex}` : '']))
  }

  function removeCol() {
    if (cols <= 2) return
    setGrid((prev) => prev.map((row) => row.slice(0, -1)))
  }

  function reset() {
    setGrid(makeGrid(DEFAULT_ROWS, DEFAULT_COLS))
    setMessage('')
  }

  const markdown = buildMarkdown(grid)

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown)
    flash('Copied')
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'table.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="tool-body md-table-tool">
      <div className="md-table-left">
        <div className="section-title-row">
          <span className="section-title">Table editor</span>
          <div className="button-row" style={{ marginTop: 0 }}>
            <span className="helper-text" style={{ margin: 0 }}>{rows} × {cols}</span>
            <button type="button" className="secondary-button" onClick={reset}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        <div className="md-table-wrap">
          <table className="md-table-editor">
            <tbody>
              {grid.map((row, r) => (
                <tr key={r} className={r === 0 ? 'md-table-header-row' : ''}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <input
                        type="text"
                        className="md-table-cell-input"
                        value={cell}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                        placeholder={r === 0 ? `Col ${c + 1}` : ''}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md-table-controls">
          <div className="md-table-control-group">
            <span className="helper-text" style={{ margin: 0 }}>Rows</span>
            <button type="button" className="icon-button" onClick={removeRow} disabled={rows <= 2} title="Remove last row">
              <Minus size={16} />
            </button>
            <button type="button" className="icon-button" onClick={addRow} disabled={rows >= MAX_ROWS} title="Add row">
              <Plus size={16} />
            </button>
          </div>
          <div className="md-table-control-group">
            <span className="helper-text" style={{ margin: 0 }}>Columns</span>
            <button type="button" className="icon-button" onClick={removeCol} disabled={cols <= 2} title="Remove last column">
              <Minus size={16} />
            </button>
            <button type="button" className="icon-button" onClick={addCol} disabled={cols >= MAX_COLS} title="Add column">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="md-table-right">
        <div className="section-title-row">
          <span className="section-title">Markdown output</span>
          <div className="button-row" style={{ marginTop: 0 }}>
            <button type="button" className="secondary-button" onClick={copyMarkdown}>
              <Clipboard size={16} aria-hidden="true" />
              Copy
            </button>
            <button type="button" className="secondary-button" onClick={downloadMarkdown}>
              <Download size={16} aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        <pre className="md-table-preview">{markdown}</pre>

        <p className="helper-text">{message || 'First row is the header. Separator is generated automatically.'}</p>
      </div>
    </div>
  )
}
