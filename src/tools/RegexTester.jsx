import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw, SearchCode } from 'lucide-react'

const samplePattern = '\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b'
const sampleText = `Contact support@example.com for help.
Send invoices to billing@example.co.uk.
Invalid examples: hello@localhost and missing-at-symbol.com`

const snippets = [
  { label: 'Email', pattern: '\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b', flags: 'gi' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s]+', flags: 'gi' },
  { label: 'ISO Date', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'g' },
  { label: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g' },
]

function uniqueFlags(flags) {
  return Array.from(new Set(flags.split(''))).join('')
}

function buildRegex(pattern, flags) {
  try {
    return { regex: new RegExp(pattern, uniqueFlags(flags.includes('g') ? flags : `${flags}g`)), error: '' }
  } catch (error) {
    return { regex: null, error: error.message }
  }
}

function findMatches(text, regex) {
  if (!regex || !text) return []

  const matches = []
  let match = regex.exec(text)
  while (match) {
    matches.push({
      value: match[0],
      index: match.index,
      groups: match.slice(1),
    })

    if (match[0] === '') regex.lastIndex += 1
    match = regex.exec(text)
  }
  return matches
}

function renderHighlightedText(text, matches) {
  if (!matches.length) return text

  const parts = []
  let cursor = 0
  matches.forEach((match, index) => {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index))
    parts.push(
      <mark key={`${match.index}-${index}`}>
        {text.slice(match.index, match.index + match.value.length) || ' '}
      </mark>,
    )
    cursor = match.index + match.value.length
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

export function RegexTester() {
  const [pattern, setPattern] = useState(samplePattern)
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState(sampleText)
  const [message, setMessage] = useState('')

  const parsed = useMemo(() => buildRegex(pattern, flags), [flags, pattern])
  const matches = useMemo(() => findMatches(text, parsed.regex), [parsed.regex, text])
  const matchOutput = useMemo(
    () =>
      matches
        .map((match, index) => {
          const groups = match.groups.filter((group) => group !== undefined)
          return groups.length
            ? `${index + 1}. ${match.value} @ ${match.index} | groups: ${groups.join(', ')}`
            : `${index + 1}. ${match.value} @ ${match.index}`
        })
        .join('\n'),
    [matches],
  )

  function toggleFlag(flag) {
    setFlags((current) => (current.includes(flag) ? current.replace(flag, '') : `${current}${flag}`))
  }

  function applySnippet(snippet) {
    setPattern(snippet.pattern)
    setFlags(snippet.flags)
    setMessage(`${snippet.label} pattern loaded`)
  }

  async function copyMatches() {
    await navigator.clipboard.writeText(matchOutput)
    setMessage('Matches copied')
  }

  function resetRegex() {
    setPattern(samplePattern)
    setFlags('gi')
    setText(sampleText)
    setMessage('Reset to sample regex')
  }

  return (
    <div className="tool-body regex-tool">
      <section className="regex-controls">
        <div className="form-grid">
          <label>
            Pattern
            <input value={pattern} onChange={(event) => setPattern(event.target.value)} />
          </label>
          <label>
            Flags
            <input value={flags} onChange={(event) => setFlags(uniqueFlags(event.target.value.replace(/[^dgimsuvy]/g, '')))} />
          </label>
        </div>

        <div className="regex-flags" aria-label="Regex flags">
          {['g', 'i', 'm', 's', 'u', 'y'].map((flag) => (
            <label className="check-row" key={flag}>
              <input type="checkbox" checked={flags.includes(flag)} onChange={() => toggleFlag(flag)} />
              {flag}
            </label>
          ))}
        </div>

        <div className="regex-snippets">
          {snippets.map((snippet) => (
            <button type="button" className="secondary-button" key={snippet.label} onClick={() => applySnippet(snippet)}>
              {snippet.label}
            </button>
          ))}
        </div>

        <label>
          Test text
          <textarea className="regex-textarea" value={text} onChange={(event) => setText(event.target.value)} />
        </label>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyMatches} disabled={!matchOutput}>
            <Clipboard size={17} aria-hidden="true" />
            Copy matches
          </button>
          <button type="button" className="secondary-button" onClick={resetRegex}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
        <p className="helper-text">{message || (parsed.error ? `Invalid regex: ${parsed.error}` : 'Regex runs locally in this browser.')}</p>
      </section>

      <section className="regex-results">
        <div className="diff-stats" aria-live="polite">
          <span>{matches.length} matches</span>
          <span>{matches.reduce((sum, match) => sum + match.groups.filter((group) => group !== undefined).length, 0)} groups</span>
          <span>{parsed.error ? 'invalid' : 'valid'}</span>
        </div>

        <pre className="regex-highlighted-output">
          <code>{renderHighlightedText(text, matches)}</code>
        </pre>

        <div className="regex-match-list">
          {matches.length ? (
            matches.map((match, index) => (
              <article key={`${match.index}-${match.value}-${index}`}>
                <SearchCode size={18} aria-hidden="true" />
                <div>
                  <strong>{match.value}</strong>
                  <span>Index {match.index}</span>
                  {match.groups.filter((group) => group !== undefined).length > 0 && (
                    <code>{match.groups.filter((group) => group !== undefined).join(' | ')}</code>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <SearchCode size={28} aria-hidden="true" />
              <p>{parsed.error ? 'Fix the pattern to see matches.' : 'No matches found.'}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
