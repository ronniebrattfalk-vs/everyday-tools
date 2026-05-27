import { useMemo, useState } from 'react'
import { diffChars, diffLines, diffWordsWithSpace } from 'diff'
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

function countTerms(value) {
  const matches = value.match(/[^\s]+/g)
  return matches ? matches.length : 0
}

function splitIntoLines(value) {
  if (!value) return ['']
  const normalized = value.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines.length ? lines : ['']
}

function buildLineDiff(original, changed) {
  return diffLines(original, changed).flatMap((part) => {
    const type = part.added ? 'added' : part.removed ? 'removed' : 'equal'
    return splitIntoLines(part.value).map((value) => ({ type, value }))
  })
}

function buildWordDiff(original, changed) {
  return diffWordsWithSpace(original, changed).map((part) => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'equal',
    value: part.value,
  }))
}

function buildCharDiff(original, changed) {
  return diffChars(original, changed).map((part) => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'equal',
    value: part.value,
  }))
}

function createLinePatch(rows) {
  return rows
    .map((row) => {
      if (row.type === 'added') return `+ ${row.value}`
      if (row.type === 'removed') return `- ${row.value}`
      return `  ${row.value}`
    })
    .join('\n')
}

function createWordPatch(parts) {
  return parts
    .map((part) => {
      if (part.type === 'added') return `{+${part.value}+}`
      if (part.type === 'removed') return `[-${part.value}-]`
      return part.value
    })
    .join('')
}

function createCharPatch(parts) {
  return parts
    .map((part) => {
      if (part.type === 'added') return `{+${part.value}+}`
      if (part.type === 'removed') return `[-${part.value}-]`
      return part.value
    })
    .join('')
}

export function TextDiffTool() {
  const [original, setOriginal] = useState(sampleOriginal)
  const [changed, setChanged] = useState(sampleChanged)
  const [mode, setMode] = useState('line')
  const [message, setMessage] = useState('')

  const lineRows = useMemo(() => buildLineDiff(original, changed), [changed, original])
  const wordParts = useMemo(() => buildWordDiff(original, changed), [changed, original])
  const charParts = useMemo(() => buildCharDiff(original, changed), [changed, original])

  const output = useMemo(() => {
    if (mode === 'line') return createLinePatch(lineRows)
    if (mode === 'word') return createWordPatch(wordParts)
    return createCharPatch(charParts)
  }, [charParts, lineRows, mode, wordParts])

  const stats = useMemo(() => {
    if (mode === 'line') {
      return {
        added: lineRows.filter((row) => row.type === 'added').length,
        removed: lineRows.filter((row) => row.type === 'removed').length,
        unchanged: lineRows.filter((row) => row.type === 'equal').length,
        labels: { added: 'added lines', removed: 'removed lines', unchanged: 'unchanged lines' },
      }
    }

    if (mode === 'word') {
      return {
        added: wordParts.filter((part) => part.type === 'added').reduce((sum, part) => sum + countTerms(part.value), 0),
        removed: wordParts.filter((part) => part.type === 'removed').reduce((sum, part) => sum + countTerms(part.value), 0),
        unchanged: wordParts.filter((part) => part.type === 'equal').reduce((sum, part) => sum + countTerms(part.value), 0),
        labels: { added: 'added words', removed: 'removed words', unchanged: 'unchanged words' },
      }
    }

    return {
      added: charParts.filter((part) => part.type === 'added').reduce((sum, part) => sum + part.value.length, 0),
      removed: charParts.filter((part) => part.type === 'removed').reduce((sum, part) => sum + part.value.length, 0),
      unchanged: charParts.filter((part) => part.type === 'equal').reduce((sum, part) => sum + part.value.length, 0),
      labels: { added: 'added chars', removed: 'removed chars', unchanged: 'unchanged chars' },
    }
  }, [charParts, lineRows, mode, wordParts])

  async function copyDiff() {
    await navigator.clipboard.writeText(output)
    setMessage(mode === 'line' ? 'Line diff copied' : mode === 'word' ? 'Word diff copied' : 'Char diff copied')
  }

  function downloadDiff() {
    const blob = new Blob([output], { type: 'text/x-diff' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = mode === 'line' ? 'text-diff.diff' : mode === 'word' ? 'text-diff-word.diff' : 'text-diff-char.diff'
    link.click()
    URL.revokeObjectURL(url)
    setMessage(mode === 'line' ? 'Line diff downloaded' : mode === 'word' ? 'Word diff downloaded' : 'Char diff downloaded')
  }

  function resetDiff() {
    setOriginal(sampleOriginal)
    setChanged(sampleChanged)
    setMode('line')
    setMessage('Reset to sample text')
  }

  return (
    <div className="tool-body text-diff-tool">
      <div className="diff-toolbar">
        <div className="diff-stats" aria-live="polite">
          <span>{stats.added} {stats.labels.added}</span>
          <span>{stats.removed} {stats.labels.removed}</span>
          <span>{stats.unchanged} {stats.labels.unchanged}</span>
        </div>
        <div className="button-row">
          <div className="diff-mode-switch" aria-label="Diff mode">
            <button type="button" className={mode === 'line' ? 'is-active' : ''} onClick={() => setMode('line')}>
              Line
            </button>
            <button type="button" className={mode === 'word' ? 'is-active' : ''} onClick={() => setMode('word')}>
              Word
            </button>
            <button type="button" className={mode === 'char' ? 'is-active' : ''} onClick={() => setMode('char')}>
              Char
            </button>
          </div>
          <button type="button" className="secondary-button" onClick={copyDiff} disabled={!output.trim()}>
            <Clipboard size={17} aria-hidden="true" />
            Copy diff
          </button>
          <button type="button" className="secondary-button" onClick={downloadDiff} disabled={!output.trim()}>
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

      {mode === 'line' ? (
        <section className="diff-output" aria-label="Line diff output">
          {lineRows.map((row, index) => (
            <pre className={`diff-row ${row.type}`} key={`${row.type}-${index}-${row.value}`}>
              <span>{row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '}</span>
              <code>{row.value || ' '}</code>
            </pre>
          ))}
        </section>
      ) : (
        <section className={`diff-output diff-output-word${mode === 'char' ? ' diff-output-char' : ''}`} aria-label={mode === 'char' ? 'Character diff output' : 'Word diff output'}>
          <pre className="diff-inline-output">
            <code>
              {(mode === 'word' ? wordParts : charParts).map((part, index) => (
                <span className={`diff-inline-part ${part.type}`} key={`${part.type}-${index}-${part.value}`}>
                  {part.value}
                </span>
              ))}
            </code>
          </pre>
        </section>
      )}

      <p className="helper-text">
        {message || (mode === 'line' ? 'Compare text locally with line-level changes.' : mode === 'word' ? 'Compare text locally with inline word changes.' : 'Compare text locally with character-level changes.')}
      </p>
    </div>
  )
}
