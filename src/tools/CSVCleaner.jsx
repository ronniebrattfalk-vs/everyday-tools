import { useMemo, useState } from 'react'
import Papa from 'papaparse'
import { Clipboard, Download, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react'

const sampleCsv = `Name,Role,Team,Location
Mira,Developer,Tools,Stockholm
Alex,Designer,Product,Gothenburg
Sam,Developer,Tools,Stockholm
Sam,Developer,Tools,Stockholm
`

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), String(value ?? '').trim()]))
}

function removeDuplicateRows(rows) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isEmptyRow(row) {
  return Object.values(row).every((value) => !String(value ?? '').trim())
}

export function CSVCleaner() {
  const [input, setInput] = useState(sampleCsv)
  const [delimiter, setDelimiter] = useState(',')
  const [trimCells, setTrimCells] = useState(true)
  const [dropEmptyRows, setDropEmptyRows] = useState(true)
  const [dropDuplicates, setDropDuplicates] = useState(true)
  const [outputFormat, setOutputFormat] = useState('csv')
  const [message, setMessage] = useState('')

  const parsed = useMemo(
    () =>
      Papa.parse(input, {
        header: true,
        skipEmptyLines: false,
        delimiter,
        transformHeader: trimCells ? (header) => header.trim() : undefined,
      }),
    [delimiter, input, trimCells],
  )

  const cleanedRows = useMemo(() => {
    let rows = parsed.data.filter((row) => row && typeof row === 'object')
    if (trimCells) rows = rows.map(normalizeRow)
    if (dropEmptyRows) rows = rows.filter((row) => !isEmptyRow(row))
    if (dropDuplicates) rows = removeDuplicateRows(rows)
    return rows
  }, [dropDuplicates, dropEmptyRows, parsed.data, trimCells])

  const fields = useMemo(() => {
    const headerFields = parsed.meta.fields || []
    const rowFields = cleanedRows.flatMap((row) => Object.keys(row))
    return Array.from(new Set([...headerFields, ...rowFields])).filter(Boolean)
  }, [cleanedRows, parsed.meta.fields])

  const output = useMemo(() => {
    if (outputFormat === 'json') return JSON.stringify(cleanedRows, null, 2)
    return Papa.unparse(cleanedRows, { columns: fields, delimiter })
  }, [cleanedRows, delimiter, fields, outputFormat])

  const parseErrors = parsed.errors.filter((error) => error.code !== 'TooFewFields')

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setMessage('Output copied')
  }

  function downloadOutput() {
    const extension = outputFormat === 'json' ? 'json' : 'csv'
    const mimeType = outputFormat === 'json' ? 'application/json' : 'text/csv'
    const blob = new Blob([output], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cleaned-data.${extension}`
    link.click()
    URL.revokeObjectURL(url)
    setMessage(`${extension.toUpperCase()} downloaded`)
  }

  async function loadFile(file) {
    if (!file) return
    setInput(await file.text())
    setMessage(`${file.name} loaded`)
  }

  function resetCsv() {
    setInput(sampleCsv)
    setDelimiter(',')
    setTrimCells(true)
    setDropEmptyRows(true)
    setDropDuplicates(true)
    setOutputFormat('csv')
    setMessage('Reset to sample CSV')
  }

  return (
    <div className="tool-body csv-tool">
      <div className="csv-toolbar">
        <div className="diff-stats" aria-live="polite">
          <span>{cleanedRows.length} rows</span>
          <span>{fields.length} columns</span>
          <span>{parseErrors.length} issues</span>
        </div>
        <div className="button-row">
          <label className="secondary-button file-button">
            <Upload size={17} aria-hidden="true" />
            Open CSV
            <input type="file" accept=".csv,text/csv" onChange={(event) => loadFile(event.target.files?.[0])} />
          </label>
          <button type="button" className="secondary-button" onClick={copyOutput} disabled={!output.trim()}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output.trim()}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={resetCsv}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="csv-grid">
        <section className="csv-input-panel">
          <div className="form-grid thirds">
            <label>
              Delimiter
              <select value={delimiter} onChange={(event) => setDelimiter(event.target.value)}>
                <option value=",">Comma</option>
                <option value=";">Semicolon</option>
                <option value="\t">Tab</option>
              </select>
            </label>
            <label>
              Output
              <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)}>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <label>
              Preview
              <input value={`${Math.min(cleanedRows.length, 50)} rows`} readOnly />
            </label>
          </div>

          <div className="option-grid csv-options">
            <label className="check-row">
              <input type="checkbox" checked={trimCells} onChange={(event) => setTrimCells(event.target.checked)} />
              Trim cells and headers
            </label>
            <label className="check-row">
              <input type="checkbox" checked={dropEmptyRows} onChange={(event) => setDropEmptyRows(event.target.checked)} />
              Remove empty rows
            </label>
            <label className="check-row">
              <input type="checkbox" checked={dropDuplicates} onChange={(event) => setDropDuplicates(event.target.checked)} />
              Remove duplicate rows
            </label>
          </div>

          <label>
            CSV input
            <textarea className="csv-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
          </label>
        </section>

        <section className="csv-output-panel">
          <div className="json-output-title">
            <h3>Preview</h3>
            <span className="json-stat">{message || (parseErrors[0]?.message ?? 'Cleaned locally')}</span>
          </div>
          <div className="csv-table-wrap">
            <table className="csv-preview-table">
              <thead>
                <tr>
                  {fields.map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cleanedRows.slice(0, 50).map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                    {fields.map((field) => (
                      <td key={field}>{row[field]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!cleanedRows.length && (
              <div className="empty-state csv-empty">
                <FileSpreadsheet size={28} aria-hidden="true" />
                <p>No rows to preview.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
