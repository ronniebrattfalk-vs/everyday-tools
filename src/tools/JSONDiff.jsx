import { useMemo, useState } from 'react'
import { create } from 'jsondiffpatch'
import { Clipboard, RotateCcw, Search } from 'lucide-react'

const jsonDiff = create({
  objectHash: (obj, index) => obj?.id ?? obj?.name ?? `$${index}`,
})

const SAMPLE_A = `{
  "name": "everyday-tools",
  "version": "0.1.0",
  "private": true,
  "features": {
    "json": true,
    "diff": false
  },
  "items": [
    { "id": 1, "name": "QR Code", "live": true },
    { "id": 2, "name": "Password", "live": true }
  ]
}`

const SAMPLE_B = `{
  "name": "everyday-tools",
  "version": "0.2.0",
  "private": false,
  "features": {
    "json": true,
    "diff": true
  },
  "items": [
    { "id": 1, "name": "QR Code", "live": true },
    { "id": 2, "name": "Password Generator", "live": true },
    { "id": 3, "name": "Text Diff", "live": true }
  ],
  "license": "MIT"
}`

const SYMBOLS = { added: '+', removed: '−', changed: '~' }

function stringify(value) {
  return typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value, null, 2)
}

function classifyDelta(delta) {
  if (Array.isArray(delta)) {
    if (delta.length === 1) return 'added'
    if (delta.length === 3 && delta[1] === 0 && delta[2] === 0) return 'removed'
    if (delta.length === 2) return 'changed'
  }
  return 'changed'
}

function flattenDelta(delta, path = '(root)') {
  if (!delta || typeof delta !== 'object') return []

  if (Array.isArray(delta)) {
    const type = classifyDelta(delta)
    return [
      {
        type,
        path,
        from: type === 'added' ? null : stringify(delta[0]),
        to: type === 'removed' ? null : stringify(type === 'changed' ? delta[1] : delta[0]),
      },
    ]
  }

  const entries = Object.entries(delta).filter(([key]) => key !== '_t')
  const isArrayDelta = delta._t === 'a'

  return entries.flatMap(([key, value]) => {
    const normalizedKey = key.startsWith('_') ? key.slice(1) : key
    const segment = isArrayDelta ? `[${normalizedKey}]` : (path === '(root)' ? normalizedKey : `.${normalizedKey}`)
    const nextPath = path === '(root)' ? (isArrayDelta ? segment : normalizedKey) : `${path}${segment}`
    return flattenDelta(value, nextPath)
  })
}

function buildPathGroups(changes, query) {
  const lowered = query.trim().toLowerCase()
  const filtered = lowered
    ? changes.filter(
        (change) =>
          change.path.toLowerCase().includes(lowered) ||
          String(change.from ?? '').toLowerCase().includes(lowered) ||
          String(change.to ?? '').toLowerCase().includes(lowered),
      )
    : changes

  const groups = new Map()
  filtered.forEach((change) => {
    const topLevel = change.path === '(root)' ? '(root)' : change.path.split(/[.[\]]/).filter(Boolean)[0] || '(root)'
    const current = groups.get(topLevel)
    if (current) {
      current.changes.push(change)
    } else {
      groups.set(topLevel, { group: topLevel, changes: [change] })
    }
  })

  return [...groups.values()].sort((first, second) => first.group.localeCompare(second.group))
}

export function JSONDiff() {
  const [left, setLeft] = useState(SAMPLE_A)
  const [right, setRight] = useState(SAMPLE_B)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [message, setMessage] = useState('')

  const result = useMemo(() => {
    let first
    let second
    try {
      first = JSON.parse(left)
    } catch (error) {
      return { leftError: error.message }
    }
    try {
      second = JSON.parse(right)
    } catch (error) {
      return { rightError: error.message }
    }

    const delta = jsonDiff.diff(first, second)
    return { delta, changes: flattenDelta(delta) }
  }, [left, right])

  const counts = useMemo(() => {
    if (!result.changes) return null
    return {
      added: result.changes.filter((change) => change.type === 'added').length,
      removed: result.changes.filter((change) => change.type === 'removed').length,
      changed: result.changes.filter((change) => change.type === 'changed').length,
    }
  }, [result])

  const groups = useMemo(() => {
    if (!result.changes) return []
    return buildPathGroups(result.changes, search)
  }, [result, search])

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
    setSearch('')
    setCollapsedGroups({})
  }

  function toggleGroup(groupName) {
    setCollapsedGroups((current) => ({
      ...current,
      [groupName]: !current[groupName],
    }))
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

      <label className="json-diff-search">
        <Search size={16} aria-hidden="true" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search paths or values" type="search" />
        <span>{groups.reduce((sum, group) => sum + group.changes.length, 0)}</span>
      </label>

      <div className="json-diff-inputs">
        <label>
          JSON A — original
          <textarea className="json-diff-textarea" value={left} onChange={(event) => setLeft(event.target.value)} spellCheck={false} />
          {result.leftError && <p className="helper-text json-diff-error">Parse error: {result.leftError}</p>}
        </label>
        <label>
          JSON B — modified
          <textarea className="json-diff-textarea" value={right} onChange={(event) => setRight(event.target.value)} spellCheck={false} />
          {result.rightError && <p className="helper-text json-diff-error">Parse error: {result.rightError}</p>}
        </label>
      </div>

      {hasChanges && (
        <div className="json-diff-output">
          {groups.map((group) => (
            <section key={group.group} className="json-diff-group">
              <button type="button" className="json-diff-group-toggle" onClick={() => toggleGroup(group.group)}>
                <strong>{group.group}</strong>
                <span>{group.changes.length} changes</span>
              </button>
              {!collapsedGroups[group.group] && (
                <div className="json-diff-group-rows">
                  {group.changes.map((change, index) => (
                    <div key={`${group.group}-${change.path}-${index}`} className={`json-diff-row ${change.type}`}>
                      <span aria-hidden="true">{SYMBOLS[change.type]}</span>
                      <div>
                        <code className="json-diff-path">{change.path}</code>
                        <div className="json-diff-values">
                          {change.from !== null && <code className="json-diff-from">{change.from}</code>}
                          {change.type === 'changed' && (
                            <span className="json-diff-arrow" aria-hidden="true">
                              →
                            </span>
                          )}
                          {change.to !== null && <code className="json-diff-to">{change.to}</code>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {isIdentical && (
        <div className="empty-state">
          <p>Both JSON objects are identical.</p>
        </div>
      )}

      <p className="helper-text">{message || 'Diffs are grouped by top-level path so larger objects are easier to scan.'}</p>
    </div>
  )
}
