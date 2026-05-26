import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleText = `  product launch checklist
Product launch checklist
send stakeholder update

review final landing page copy
review final landing page copy
publish release notes  `

const caseOptions = [
  { id: 'none', label: 'Original' },
  { id: 'upper', label: 'UPPER' },
  { id: 'lower', label: 'lower' },
  { id: 'title', label: 'Title' },
  { id: 'sentence', label: 'Sentence' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT' },
]

function wordsFromLine(line) {
  return line
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
}

function capitalizeWord(word) {
  return word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : ''
}

function transformLine(line, caseMode) {
  const words = wordsFromLine(line)
  if (caseMode === 'none') return line
  if (!words.length) return ''

  if (caseMode === 'upper') return line.toUpperCase()
  if (caseMode === 'lower') return line.toLowerCase()
  if (caseMode === 'title') return words.map(capitalizeWord).join(' ')
  if (caseMode === 'sentence') {
    const sentence = words.join(' ').toLowerCase()
    return `${sentence[0].toUpperCase()}${sentence.slice(1)}`
  }
  if (caseMode === 'camel') {
    return words.map((word, index) => (index === 0 ? word.toLowerCase() : capitalizeWord(word))).join('')
  }
  if (caseMode === 'pascal') return words.map(capitalizeWord).join('')
  if (caseMode === 'snake') return words.map((word) => word.toLowerCase()).join('_')
  if (caseMode === 'kebab') return words.map((word) => word.toLowerCase()).join('-')
  if (caseMode === 'constant') return words.map((word) => word.toUpperCase()).join('_')

  return line
}

function cleanText(input, options) {
  let lines = input.split(/\r?\n/)

  if (options.trimLines) lines = lines.map((line) => line.trim())
  if (options.normalizeSpaces) lines = lines.map((line) => line.replace(/\s+/g, ' '))
  if (options.removeEmpty) lines = lines.filter((line) => line.trim())
  if (options.removeDuplicates) {
    const seen = new Set()
    lines = lines.filter((line) => {
      const key = line.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  if (options.sortLines) {
    lines = [...lines].sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' }))
  }

  return lines.map((line) => transformLine(line, options.caseMode)).join('\n')
}

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function TextCleaner() {
  const [input, setInput] = useState(sampleText)
  const [caseMode, setCaseMode] = useState('title')
  const [trimLines, setTrimLines] = useState(true)
  const [normalizeSpaces, setNormalizeSpaces] = useState(true)
  const [removeEmpty, setRemoveEmpty] = useState(true)
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const [sortLines, setSortLines] = useState(false)
  const [message, setMessage] = useState('')

  const output = useMemo(
    () => cleanText(input, { caseMode, normalizeSpaces, removeDuplicates, removeEmpty, sortLines, trimLines }),
    [caseMode, input, normalizeSpaces, removeDuplicates, removeEmpty, sortLines, trimLines],
  )

  const stats = useMemo(
    () => ({
      inputLines: input ? input.split(/\r?\n/).length : 0,
      outputLines: output ? output.split(/\r?\n/).length : 0,
      words: countWords(output),
      characters: output.length,
    }),
    [input, output],
  )

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setMessage('Cleaned text copied')
  }

  function downloadOutput() {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cleaned-text.txt'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Cleaned text downloaded')
  }

  function resetTool() {
    setInput(sampleText)
    setCaseMode('title')
    setTrimLines(true)
    setNormalizeSpaces(true)
    setRemoveEmpty(true)
    setRemoveDuplicates(true)
    setSortLines(false)
    setMessage('Reset text cleaner')
  }

  return (
    <div className="tool-body text-cleaner-tool">
      <section className="text-cleaner-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Transform</p>
            <h3>Case and cleanup</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Input
          <textarea className="text-cleaner-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <div className="case-option-grid" aria-label="Case conversion options">
          {caseOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              className={caseMode === option.id ? 'is-active' : ''}
              onClick={() => setCaseMode(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="cleaner-options">
          <label className="check-row">
            <input type="checkbox" checked={trimLines} onChange={(event) => setTrimLines(event.target.checked)} />
            Trim lines
          </label>
          <label className="check-row">
            <input type="checkbox" checked={normalizeSpaces} onChange={(event) => setNormalizeSpaces(event.target.checked)} />
            Normalize spaces
          </label>
          <label className="check-row">
            <input type="checkbox" checked={removeEmpty} onChange={(event) => setRemoveEmpty(event.target.checked)} />
            Remove empty
          </label>
          <label className="check-row">
            <input type="checkbox" checked={removeDuplicates} onChange={(event) => setRemoveDuplicates(event.target.checked)} />
            Remove duplicates
          </label>
          <label className="check-row">
            <input type="checkbox" checked={sortLines} onChange={(event) => setSortLines(event.target.checked)} />
            Sort A-Z
          </label>
        </div>
      </section>

      <section className="text-cleaner-output">
        <div className="markdown-toolbar">
          <div className="diff-stats" aria-live="polite">
            <span>{stats.outputLines} lines</span>
            <span>{stats.words} words</span>
            <span>{stats.characters} chars</span>
            <span>{Math.max(stats.inputLines - stats.outputLines, 0)} removed</span>
          </div>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={copyOutput} disabled={!output.trim()}>
              <Clipboard size={17} aria-hidden="true" />
              Copy
            </button>
            <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output.trim()}>
              <Download size={17} aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        <label>
          Output
          <textarea className="text-cleaner-textarea output" value={output} readOnly />
        </label>

        <p className="helper-text">{message || 'Clean lists, normalize text, and convert casing locally.'}</p>
      </section>
    </div>
  )
}
