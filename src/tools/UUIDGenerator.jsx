import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

function makeUuids(count, uppercase, braces) {
  return Array.from({ length: count }, () => {
    const value = crypto.randomUUID()
    const cased = uppercase ? value.toUpperCase() : value
    return braces ? `{${cased}}` : cased
  })
}

function downloadText(value, filename) {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function UUIDGenerator() {
  const [count, setCount] = useState(12)
  const [uppercase, setUppercase] = useState(false)
  const [braces, setBraces] = useState(false)
  const [uuids, setUuids] = useState(() => makeUuids(12, false, false))
  const [message, setMessage] = useState('')

  const output = useMemo(() => uuids.join('\n'), [uuids])

  function generate() {
    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 500)
    setCount(safeCount)
    setUuids(makeUuids(safeCount, uppercase, braces))
    setMessage(`${safeCount} UUIDs generated`)
  }

  async function copyAll() {
    await navigator.clipboard.writeText(output)
    setMessage('UUIDs copied')
  }

  function downloadAll() {
    downloadText(output, 'uuids.txt')
    setMessage('UUIDs downloaded')
  }

  function resetTool() {
    setCount(12)
    setUppercase(false)
    setBraces(false)
    setUuids(makeUuids(12, false, false))
    setMessage('Reset UUID generator')
  }

  return (
    <div className="tool-body uuid-tool">
      <section className="uuid-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Version 4</p>
            <h3>Batch generator</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Amount
          <input type="number" min="1" max="500" value={count} onChange={(event) => setCount(event.target.value)} />
        </label>

        <div className="cleaner-options">
          <label className="check-row">
            <input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
            Uppercase
          </label>
          <label className="check-row">
            <input type="checkbox" checked={braces} onChange={(event) => setBraces(event.target.checked)} />
            Wrap in braces
          </label>
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={generate}>
            Generate
          </button>
          <button type="button" className="secondary-button" onClick={copyAll}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadAll}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        <p className="helper-text">{message || 'Generate browser-native random UUID v4 values.'}</p>
      </section>

      <section className="uuid-output">
        <div className="json-output-title">
          <h3>UUIDs</h3>
          <span className="json-stat">{uuids.length} values</span>
        </div>
        <textarea className="code-area" value={output} readOnly spellCheck="false" />
      </section>
    </div>
  )
}
