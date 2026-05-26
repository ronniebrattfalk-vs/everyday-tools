import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function diffObjects(a, b, path = '') {
  const changes = []
  const typeA = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a
  const typeB = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b

  if (typeA !== typeB) {
    changes.push({ type: 'changed', path: path || '(root)', from: JSON.stringify(a), to: JSON.stringify(b) })
    return changes
  }

  if (typeA !== 'object' && typeA !== 'array') {
    if (a !== b) {
      changes.push({ type: 'changed', path: path || '(root)', from: JSON.stringify(a), to: JSON.stringify(b) })
    }
    return changes
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  const allKeys = [...new Set([...keysA, ...keysB])]

  for (const key of allKeys) {
    const segment = typeA === 'array' ? `[${key}]` : `.${key}`
    const nextPath = path ? `${path}${segment}` : (typeA === 'array' ? segment : key)
    if (!(key in a)) {
      changes.push({ type: 'added', path: nextPath, from: null, to: JSON.stringify(b[key]) })
    } else if (!(key in b)) {
      changes.push({ type: 'removed', path: nextPath, from: JSON.stringify(a[key]), to: null })
    } else {
      changes.push(...diffObjects(a[key], b[key], nextPath))
    }
  }

  return changes
}

const SAMPLE_A = `{
  "name": "everyday-tools",
  "version": "0.1.0",
  "private": true,
  "author": "Jane"
}`

const SAMPLE_B = `{
  "name": "everyday-tools",
  "version": "0.2.0",
  "private": false,
  "license": "MIT"
}`

const SYMBOLS = { added: '+', removed: '−', changed: '~' }

export function JSONDiff() {
  const [left, setLeft] = useState(SAMPLE_A)
  const [right, setRight] = useState(SAMPLE_B)
  const [message, setMessage] = useState('')

  const result = useMemo(() => {
    let a, b
    try { a = JSON.parse(left) } catch (e) { return { leftError: e.message } }
    try { b = JSON.parse(right) } catch (e) { return { rightError: e.message } }
    return { changes: diffObjects(a, b) }
  }, [left, right])

  const counts = useMemo(() => {
    if (!result.changes) return null
    return {
      added: result.changes.filter((c) => c.type === 'added').length,
      removed: result.changes.filter((c) => c.type === 'removed').length,
      changed: result.changes.filter((c) => c.type === 'changed').length,
    }
  }, [result])

  async function copyDiff() {
    if (!result.changes) return
    const lines = result.changes.map(({ type, path, from, to }) => {
      if (type === 'added') return `+ ${path}: ${to}`
      if (type === 'removed') return `- ${path}: ${from}`
      return `~ ${path}: ${from} → ${to}`
    })
    await navigator.clipboard.writeText(lines.join('\n'))
    setMessage('Diff copied')
    setTimeout(() => setMessage(''), 1500)
  }

  function reset() {
    setLeft(SAMPLE_A)
    setRight(SAMPLE_B)
  }

  const hasChanges = result.changes && result.changes.length > 0
  const isIdentical = result.changes && result.changes.length === 0

  return (
    <div className="tool-body json-diff-tool">
      <div className="json-diff-toolbar">
        <div className="json-diff-stats">
          {counts && (
            <>
              {counts.added > 0 && <span className="json-diff-stat added">{counts.added} added</span>}
              {counts.removed > 0 && <span className="json-diff-stat removed">{counts.removed} removed</span>}
              {counts.changed > 0 && <span className="json-diff-stat changed">{counts.changed} changed</span>}
              {isIdentical && <span className="json-diff-stat">Identical</span>}
            </>
          )}
        </div>
        <div className="button-row" style={{ marginTop: 0 }}>
          <button type="button" className="secondary-button" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={copyDiff} disabled={!result.changes}>
            <Clipboard size={16} aria-hidden="true" />
            Copy diff
          </button>
        </div>
      </div>

      <div className="json-diff-inputs">
        <label>
          JSON A — original
          <textarea
            className="json-diff-textarea"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            spellCheck={false}
          />
          {result.leftError && (
            <p className="helper-text json-diff-error">Parse error: {result.leftError}</p>
          )}
        </label>
        <label>
          JSON B — modified
          <textarea
            className="json-diff-textarea"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            spellCheck={false}
          />
          {result.rightError && (
            <p className="helper-text json-diff-error">Parse error: {result.rightError}</p>
          )}
        </label>
      </div>

      {hasChanges && (
        <div className="json-diff-output">
          {result.changes.map((change, i) => (
            <div key={i} className={`json-diff-row ${change.type}`}>
              <span aria-hidden="true">{SYMBOLS[change.type]}</span>
              <div>
                <code className="json-diff-path">{change.path}</code>
                <div className="json-diff-values">
                  {change.from !== null && <code className="json-diff-from">{change.from}</code>}
                  {change.type === 'changed' && <span className="json-diff-arrow" aria-hidden="true">→</span>}
                  {change.to !== null && <code className="json-diff-to">{change.to}</code>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isIdentical && (
        <div className="empty-state">
          <p>Both JSON objects are identical.</p>
        </div>
      )}

      <p className="helper-text">{message || 'Differences are shown as paths. Arrays are compared by index.'}</p>
    </div>
  )
}
