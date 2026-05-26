import { useMemo, useRef, useState } from 'react'
import { Clipboard, Download, RotateCcw, Upload } from 'lucide-react'
import Papa from 'papaparse'

const SAMPLE_JSON = `[
  { "name": "Alice", "role": "Engineer", "team": "Platform" },
  { "name": "Bob",   "role": "Designer",  "team": "Product" },
  { "name": "Carol", "role": "Manager",   "team": "Platform" }
]`

const SAMPLE_CSV = `name,role,team
Alice,Engineer,Platform
Bob,Designer,Product
Carol,Manager,Platform`

function jsonToCsv(text) {
  let parsed
  try { parsed = JSON.parse(text) } catch (e) { return { error: e.message } }
  if (!Array.isArray(parsed)) return { error: 'JSON must be an array of objects.' }
  if (parsed.length === 0) return { error: 'Array is empty.' }
  if (typeof parsed[0] !== 'object' || parsed[0] === null) return { error: 'Array items must be objects.' }
  const csv = Papa.unparse(parsed)
  return { csv, rows: parsed }
}

function csvToJson(text) {
  const result = Papa.parse(text.trim(), { header: true, skipEmptyLines: true })
  if (result.errors.length > 0) return { error: result.errors[0].message }
  return { rows: result.data, headers: result.meta.fields }
}

function download(text, filename, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function JSONCSVConverter() {
  const [mode, setMode] = useState('json-to-csv')
  const [input, setInput] = useState(SAMPLE_JSON)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const result = useMemo(() => {
    if (!input.trim()) return null
    return mode === 'json-to-csv' ? jsonToCsv(input) : csvToJson(input)
  }, [input, mode])

  function switchMode(next) {
    setMode(next)
    setInput(next === 'json-to-csv' ? SAMPLE_JSON : SAMPLE_CSV)
    setMessage('')
  }

  async function copyOutput() {
    if (!result) return
    const text = mode === 'json-to-csv' ? result.csv : JSON.stringify(result.rows, null, 2)
    if (!text) return
    await navigator.clipboard.writeText(text)
    flash('Copied')
  }

  function downloadOutput() {
    if (!result) return
    if (mode === 'json-to-csv' && result.csv) {
      download(result.csv, 'output.csv', 'text/csv')
    } else if (mode === 'csv-to-json' && result.rows) {
      download(JSON.stringify(result.rows, null, 2), 'output.json', 'application/json')
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setInput(ev.target.result ?? '')
    reader.readAsText(file)
    e.target.value = ''
  }

  const headers = useMemo(() => {
    if (!result || result.error) return []
    if (mode === 'json-to-csv') return result.rows?.length ? Object.keys(result.rows[0]) : []
    return result.headers ?? []
  }, [result, mode])

  const rows = result?.rows ?? []
  const outputText = result?.error
    ? null
    : mode === 'json-to-csv'
      ? result?.csv
      : result?.rows ? JSON.stringify(result.rows, null, 2) : null

  return (
    <div className="tool-body csv-json-tool">
      <div className="csv-json-left">
        <div className="section-title-row">
          <span className="section-title">Input</span>
          <div className="category-tabs compact">
            <button
              className={mode === 'json-to-csv' ? 'active' : ''}
              onClick={() => switchMode('json-to-csv')}
            >JSON → CSV</button>
            <button
              className={mode === 'csv-to-json' ? 'active' : ''}
              onClick={() => switchMode('csv-to-json')}
            >CSV → JSON</button>
          </div>
        </div>

        <textarea
          className="csv-json-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder={mode === 'json-to-csv' ? 'Paste JSON array…' : 'Paste CSV text…'}
        />

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => { setInput(''); setMessage('') }}>
            <RotateCcw size={16} aria-hidden="true" />
            Clear
          </button>
          <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden="true" />
            Upload file
          </button>
          <input ref={fileRef} type="file" accept=".json,.csv,.txt" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      </div>

      <div className="csv-json-right">
        <div className="section-title-row">
          <span className="section-title">
            {mode === 'json-to-csv' ? 'CSV output' : 'JSON output'}
          </span>
          <div className="button-row" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="secondary-button"
              onClick={copyOutput}
              disabled={!outputText}
            >
              <Clipboard size={16} aria-hidden="true" />
              Copy
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={downloadOutput}
              disabled={!outputText}
            >
              <Download size={16} aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        {result?.error && (
          <p className="helper-text" style={{ color: 'var(--color-error)' }}>Error: {result.error}</p>
        )}

        {!result && (
          <div className="empty-state"><p>Paste {mode === 'json-to-csv' ? 'a JSON array' : 'CSV text'} to begin.</p></div>
        )}

        {outputText && headers.length > 0 && (
          <div className="csv-json-preview">
            <div className="csv-json-table-wrap">
              <table className="csv-json-table">
                <thead>
                  <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => <td key={h}>{row[h] ?? ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && (
              <p className="helper-text">Showing 50 of {rows.length} rows.</p>
            )}
          </div>
        )}
      </div>

      <p className="helper-text csv-json-footer">{message || ' '}</p>
    </div>
  )
}
