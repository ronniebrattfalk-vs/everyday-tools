import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleOriginal = `Everyday Tools
Fast, private tools for everyday work.
No signup required.
PDF tools can create and merge files.`

const sampleChanged = `Everyday Tools
Fast, private browser tools for everyday work.
No signup required.
PDF tools can create, merge, and split files.
Favorites can sync when signed in.`

function buildLineDiff(original, changed) {
  const left = original.split('\n')
  const right = changed.split('\n')
  const table = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0))

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const rows = []
  let i = 0
  let j = 0

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      rows.push({ type: 'equal', value: left[i] })
      i += 1
      j += 1
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: 'removed', value: left[i] })
      i += 1
    } else {
      rows.push({ type: 'added', value: right[j] })
      j += 1
    }
  }

  while (i < left.length) {
    rows.push({ type: 'removed', value: left[i] })
    i += 1
  }

  while (j < right.length) {
    rows.push({ type: 'added', value: right[j] })
    j += 1
  }

  return rows
}

function createPatch(rows) {
  return rows
    .map((row) => {
      if (row.type === 'added') return `+ ${row.value}`
      if (row.type === 'removed') return `- ${row.value}`
      return `  ${row.value}`
    })
    .join('\n')
}

export function TextDiffTool() {
  const [original, setOriginal] = useState(sampleOriginal)
  const [changed, setChanged] = useState(sampleChanged)
  const [message, setMessage] = useState('')

  const diffRows = useMemo(() => buildLineDiff(original, changed), [changed, original])
  const patch = useMemo(() => createPatch(diffRows), [diffRows])
  const stats = useMemo(
    () => ({
      added: diffRows.filter((row) => row.type === 'added').length,
      removed: diffRows.filter((row) => row.type === 'removed').length,
      unchanged: diffRows.filter((row) => row.type === 'equal').length,
    }),
    [diffRows],
  )

  async function copyDiff() {
    await navigator.clipboard.writeText(patch)
    setMessage('Diff copied')
  }

  function downloadDiff() {
    const blob = new Blob([patch], { type: 'text/x-diff' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'text-diff.diff'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Diff downloaded')
  }

  function resetDiff() {
    setOriginal(sampleOriginal)
    setChanged(sampleChanged)
    setMessage('Reset to sample text')
  }

  return (
    <div className="tool-body text-diff-tool">
      <div className="diff-toolbar">
        <div className="diff-stats" aria-live="polite">
          <span>{stats.added} added</span>
          <span>{stats.removed} removed</span>
          <span>{stats.unchanged} unchanged</span>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyDiff} disabled={!patch.trim()}>
            <Clipboard size={17} aria-hidden="true" />
            Copy diff
          </button>
          <button type="button" className="secondary-button" onClick={downloadDiff} disabled={!patch.trim()}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={resetDiff}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="diff-input-grid">
        <label>
          Original text
          <textarea value={original} onChange={(event) => setOriginal(event.target.value)} />
        </label>
        <label>
          Changed text
          <textarea value={changed} onChange={(event) => setChanged(event.target.value)} />
        </label>
      </div>

      <section className="diff-output" aria-label="Line diff output">
        {diffRows.map((row, index) => (
          <pre className={`diff-row ${row.type}`} key={`${row.type}-${index}-${row.value}`}>
            <span>{row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '}</span>
            <code>{row.value || ' '}</code>
          </pre>
        ))}
      </section>
      <p className="helper-text">{message || 'Compare text locally in this browser.'}</p>
    </div>
  )
}
