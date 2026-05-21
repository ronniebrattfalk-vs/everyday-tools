import { useMemo, useState } from 'react'
import {
  ArrowDownAZ,
  Clipboard,
  Columns2,
  Download,
  Eye,
  FileCode2,
  Minimize2,
  RotateCcw,
  Search,
  Upload,
  Wand2,
} from 'lucide-react'

const sampleJson = `{
  "site": "Everyday Tools",
  "privacy": true,
  "tools": ["QR Code", "Password", "Unit Converter"]
}`

function getErrorLocation(value, message) {
  const match = message.match(/position\s+(\d+)/i)
  if (!match) return ''
  const position = Number(match[1])
  const before = value.slice(0, position)
  const line = before.split('\n').length
  const column = before.length - before.lastIndexOf('\n')
  return `Line ${line}, column ${column}`
}

function parseJson(value) {
  try {
    return { data: JSON.parse(value), error: '', location: '' }
  } catch (error) {
    return {
      data: null,
      error: error.message,
      location: getErrorLocation(value, error.message),
    }
  }
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((sorted, key) => {
        sorted[key] = sortKeys(value[key])
        return sorted
      }, {})
  }
  return value
}

function getValueClass(value) {
  if (value === 'true' || value === 'false') return 'boolean'
  if (value === 'null') return 'null'
  if (/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) return 'number'
  return 'string'
}

function highlightJson(value) {
  const parts = []
  const matcher = /("(?:\\.|[^"\\])*")(\s*:)?|true|false|null|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?|[{}[\],]/gi
  let cursor = 0
  let match = matcher.exec(value)

  while (match) {
    if (match.index > cursor) {
      parts.push(value.slice(cursor, match.index))
    }

    const token = match[0]
    const isKey = Boolean(match[2])
    const label = isKey ? match[1] : token
    const suffix = isKey ? match[2] : ''
    const className = isKey ? 'key' : /^[{}[\],]$/.test(token) ? 'punctuation' : getValueClass(token)

    parts.push(
      <span className={`json-token ${className}`} key={`${match.index}-${token}`}>
        {label}
      </span>,
    )
    if (suffix) {
      parts.push(
        <span className="json-token punctuation" key={`${match.index}-${token}-suffix`}>
          {suffix}
        </span>,
      )
    }

    cursor = matcher.lastIndex
    match = matcher.exec(value)
  }

  if (cursor < value.length) {
    parts.push(value.slice(cursor))
  }

  return parts
}

export function JSONFormatter() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState(() => JSON.stringify(JSON.parse(sampleJson), null, 2))
  const [outputView, setOutputView] = useState('highlighted')
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')

  const parsed = useMemo(() => parseJson(input), [input])
  const isValid = !parsed.error
  const stats = useMemo(() => {
    const source = output || input
    return {
      characters: source.length,
      lines: source ? source.split('\n').length : 0,
    }
  }, [input, output])
  const searchCount = useMemo(() => {
    if (!searchTerm.trim()) return 0
    return output.toLowerCase().split(searchTerm.trim().toLowerCase()).length - 1
  }, [output, searchTerm])

  function formatJson() {
    if (!isValid) return
    setOutput(JSON.stringify(parsed.data, null, 2))
    setMessage('JSON formatted')
  }

  function minifyJson() {
    if (!isValid) return
    setOutput(JSON.stringify(parsed.data))
    setMessage('JSON minified')
  }

  function sortJsonKeys() {
    if (!isValid) return
    setOutput(JSON.stringify(sortKeys(parsed.data), null, 2))
    setMessage('JSON keys sorted')
  }

  function mirrorInput() {
    setOutput(input)
    setMessage('Input mirrored to output')
  }

  async function copyOutput() {
    if (!output.trim()) return
    await navigator.clipboard.writeText(output)
    setMessage('Output copied')
  }

  async function loadFile(file) {
    if (!file) return
    const text = await file.text()
    setInput(text)
    const fileParse = parseJson(text)
    if (!fileParse.error) {
      setOutput(JSON.stringify(fileParse.data, null, 2))
      setOutputView('highlighted')
      setMessage(`${file.name} loaded and formatted`)
    } else {
      setOutput(text)
      setOutputView('raw')
      setMessage(`${file.name} loaded, but JSON has syntax errors`)
    }
  }

  function downloadOutput() {
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'formatted.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('JSON downloaded')
  }

  function resetJson() {
    setInput(sampleJson)
    setOutput(JSON.stringify(JSON.parse(sampleJson), null, 2))
    setOutputView('highlighted')
    setSearchTerm('')
    setMessage('Reset to sample JSON')
  }

  return (
    <div className="tool-body">
      <div className="json-status" aria-live="polite">
        <span>
          <span className={isValid ? 'status-dot valid' : 'status-dot invalid'}></span>
          {isValid ? 'Valid JSON' : `${parsed.error}${parsed.location ? ` (${parsed.location})` : ''}`}
        </span>
        <span className="json-stat">
          {stats.lines} lines - {stats.characters} chars
        </span>
      </div>

      <div className="json-toolbar">
        <label className="secondary-button file-button">
          <Upload size={17} aria-hidden="true" />
          Open JSON
          <input type="file" accept=".json,application/json,text/json" onChange={(event) => loadFile(event.target.files?.[0])} />
        </label>
        <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output.trim()}>
          <Download size={17} aria-hidden="true" />
          Download
        </button>
        <button type="button" className="secondary-button" onClick={resetJson}>
          <RotateCcw size={17} aria-hidden="true" />
          Reset
        </button>
        <label className="json-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search output"
            type="search"
          />
          <span>{searchTerm ? searchCount : 0}</span>
        </label>
      </div>

      <div className="json-grid">
        <div className="control-stack">
          <label htmlFor="json-input">Input</label>
          <textarea
            id="json-input"
            className="code-area"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setMessage('')
            }}
            spellCheck="false"
          />
        </div>

        <div className="control-stack">
          <div className="json-output-title">
            <label htmlFor="json-output">Output</label>
            <div className="json-view-switch" aria-label="JSON output view">
              <button
                type="button"
                className={outputView === 'highlighted' ? 'is-active' : ''}
                onClick={() => setOutputView('highlighted')}
              >
                <Eye size={15} aria-hidden="true" />
                Preview
              </button>
              <button
                type="button"
                className={outputView === 'raw' ? 'is-active' : ''}
                onClick={() => setOutputView('raw')}
              >
                <FileCode2 size={15} aria-hidden="true" />
                Raw
              </button>
            </div>
          </div>
          {outputView === 'raw' ? (
            <textarea id="json-output" className="code-area" value={output} readOnly spellCheck="false" />
          ) : (
            <pre id="json-output" className="json-highlighted-output" aria-live="polite">
              <code>{highlightJson(output)}</code>
            </pre>
          )}
        </div>
      </div>

      <div className="button-row">
        <button type="button" className="primary-button" onClick={formatJson} disabled={!isValid}>
          <Wand2 size={17} aria-hidden="true" />
          Format
        </button>
        <button type="button" className="secondary-button" onClick={minifyJson} disabled={!isValid}>
          <Minimize2 size={17} aria-hidden="true" />
          Minify
        </button>
        <button type="button" className="secondary-button" onClick={sortJsonKeys} disabled={!isValid}>
          <ArrowDownAZ size={17} aria-hidden="true" />
          Sort keys
        </button>
        <button type="button" className="secondary-button" onClick={mirrorInput}>
          <Columns2 size={17} aria-hidden="true" />
          Mirror
        </button>
        <button type="button" className="secondary-button" onClick={copyOutput}>
          <Clipboard size={17} aria-hidden="true" />
          Copy output
        </button>
      </div>

      <p className="helper-text">{message || 'Paste JSON to validate it, pretty-print it, or make it compact.'}</p>
    </div>
  )
}
