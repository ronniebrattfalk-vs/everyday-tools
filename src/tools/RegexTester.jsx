import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw, Save, SearchCode, Trash2 } from 'lucide-react'

const presetKey = 'everyday-tools.regex-presets'
const samplePattern = '\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b'
const sampleText = `Contact support@example.com for help.
Send invoices to billing@example.co.uk.
Invalid examples: hello@localhost and missing-at-symbol.com`

const snippets = [
  { label: 'Email', pattern: '\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b', flags: 'gi', mode: 'match', replacement: '[hidden-email]' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s]+', flags: 'gi', mode: 'match', replacement: '[link]' },
  { label: 'ISO Date', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'g', mode: 'match', replacement: '[date]' },
  { label: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g', mode: 'match', replacement: '#000000' },
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

function extractGroupNames(pattern) {
  const names = []
  const re = /\(\?<([^>]+)>/g
  let m
  while ((m = re.exec(pattern)) !== null) {
    names.push(m[1])
  }
  return names
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
      namedGroups: match.groups || {},
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

function loadSavedPresets() {
  try {
    return JSON.parse(localStorage.getItem(presetKey) || '[]')
  } catch {
    return []
  }
}

export function RegexTester() {
  const [mode, setMode] = useState('match')
  const [pattern, setPattern] = useState(samplePattern)
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState(sampleText)
  const [replacement, setReplacement] = useState('[hidden-email]')
  const [presetName, setPresetName] = useState('')
  const [savedPresets, setSavedPresets] = useState(() => loadSavedPresets())
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [message, setMessage] = useState('')

  const parsed = useMemo(() => buildRegex(pattern, flags), [flags, pattern])
  const matches = useMemo(() => findMatches(text, parsed.regex), [parsed.regex, text])
  const groupNames = useMemo(() => extractGroupNames(pattern), [pattern])
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
  const replacedText = useMemo(() => {
    if (!parsed.regex) return ''
    return text.replace(parsed.regex, replacement)
  }, [parsed.regex, replacement, text])

  function toggleFlag(flag) {
    setFlags((current) => (current.includes(flag) ? current.replace(flag, '') : `${current}${flag}`))
  }

  function applySnippet(snippet) {
    setMode(snippet.mode || 'match')
    setPattern(snippet.pattern)
    setFlags(snippet.flags)
    setReplacement(snippet.replacement || replacement)
    setMessage(`${snippet.label} pattern loaded`)
  }

  function savePreset() {
    const trimmedName = presetName.trim()
    if (!trimmedName) {
      setMessage('Add a preset name first')
      return
    }

    const nextPreset = {
      id: crypto.randomUUID(),
      label: trimmedName,
      pattern,
      flags,
      mode,
      replacement,
    }

    setSavedPresets((current) => {
      const next = [...current, nextPreset]
      localStorage.setItem(presetKey, JSON.stringify(next))
      return next
    })
    setSelectedPresetId(nextPreset.id)
    setPresetName('')
    setMessage(`Saved preset "${trimmedName}"`)
  }

  function applySavedPreset() {
    const preset = savedPresets.find((item) => item.id === selectedPresetId)
    if (!preset) return

    setMode(preset.mode || 'match')
    setPattern(preset.pattern)
    setFlags(preset.flags)
    setReplacement(preset.replacement || '')
    setMessage(`Applied preset "${preset.label}"`)
  }

  function deleteSavedPreset() {
    if (!selectedPresetId) return

    setSavedPresets((current) => {
      const next = current.filter((item) => item.id !== selectedPresetId)
      localStorage.setItem(presetKey, JSON.stringify(next))
      return next
    })
    setSelectedPresetId('')
    setMessage('Preset removed')
  }

  async function copyMatches() {
    await navigator.clipboard.writeText(matchOutput)
    setMessage('Matches copied')
  }

  async function copyReplacement() {
    await navigator.clipboard.writeText(replacedText)
    setMessage('Replaced text copied')
  }

  function resetRegex() {
    setMode('match')
    setPattern(samplePattern)
    setFlags('gi')
    setText(sampleText)
    setReplacement('[hidden-email]')
    setPresetName('')
    setSelectedPresetId('')
    setMessage('Reset to sample regex')
  }

  return (
    <div className="tool-body regex-tool">
      <section className="regex-controls">
        <div className="category-tabs compact" aria-label="Regex mode">
          <button type="button" className={mode === 'match' ? 'is-active' : ''} onClick={() => setMode('match')}>
            Match
          </button>
          <button type="button" className={mode === 'replace' ? 'is-active' : ''} onClick={() => setMode('replace')}>
            Replace
          </button>
        </div>

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

        {mode === 'replace' && (
          <label>
            Replacement
            <input
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
              placeholder="Use $1, $2, etc. for capture groups"
            />
          </label>
        )}

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

        <div className="regex-preset-grid">
          <label>
            Save current regex
            <div className="regex-preset-save">
              <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Preset name" />
              <button type="button" className="secondary-button" onClick={savePreset}>
                <Save size={17} aria-hidden="true" />
                Save
              </button>
            </div>
          </label>
          <label>
            Saved presets
            <div className="regex-preset-apply">
              <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
                <option value="">Choose a preset</option>
                {savedPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <button type="button" className="secondary-button" onClick={applySavedPreset} disabled={!selectedPresetId}>
                Apply
              </button>
              <button type="button" className="secondary-button" onClick={deleteSavedPreset} disabled={!selectedPresetId}>
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </div>
          </label>
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
          {mode === 'replace' && (
            <button type="button" className="secondary-button" onClick={copyReplacement} disabled={!replacedText}>
              <Clipboard size={17} aria-hidden="true" />
              Copy replaced text
            </button>
          )}
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
          {groupNames.length > 0 && <span>{groupNames.length} named</span>}
          <span>{parsed.error ? 'invalid' : 'valid'}</span>
        </div>

        {mode === 'match' ? (
          <>
            <pre className="regex-highlighted-output">
              <code>{renderHighlightedText(text, matches)}</code>
            </pre>

            <div className="regex-match-list">
              {matches.length ? (
                matches.map((match, index) => {
                  const definedGroups = match.groups.filter((group) => group !== undefined)
                  const namedEntries = Object.entries(match.namedGroups)
                  return (
                    <article key={`${match.index}-${match.value}-${index}`}>
                      <SearchCode size={18} aria-hidden="true" />
                      <div>
                        <strong>{match.value}</strong>
                        <span>Index {match.index}</span>
                        {namedEntries.length > 0 ? (
                          <div className="regex-named-groups">
                            {namedEntries.map(([name, val]) => (
                              <span key={name} className="regex-named-group">
                                <em>{name}</em>{val}
                              </span>
                            ))}
                          </div>
                        ) : definedGroups.length > 0 && (
                          <code>{definedGroups.join(' | ')}</code>
                        )}
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="empty-state">
                  <SearchCode size={28} aria-hidden="true" />
                  <p>{parsed.error ? 'Fix the pattern to see matches.' : 'No matches found.'}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="regex-replace-panel">
            <div className="json-output-title">
              <h3>Replace Preview</h3>
              <span className="json-stat">{matches.length} substitutions</span>
            </div>
            <pre className="regex-highlighted-output regex-replaced-output">
              <code>{replacedText || 'Replaced output will appear here.'}</code>
            </pre>
          </div>
        )}
      </section>
    </div>
  )
}
