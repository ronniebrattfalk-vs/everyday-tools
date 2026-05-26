import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleLines = `Confirm release scope
Review landing page
Prepare customer email
Update help article
Schedule launch post`

function parseItems(value, prefix) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `${prefix} ${line}`)
    .join('\n')
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

export function ChecklistBuilder() {
  const [input, setInput] = useState(sampleLines)
  const [style, setStyle] = useState('markdown')
  const [message, setMessage] = useState('')

  const prefix = style === 'plain' ? '[ ]' : '- [ ]'
  const output = useMemo(() => parseItems(input, prefix), [input, prefix])
  const itemCount = output ? output.split('\n').length : 0

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setMessage('Checklist copied')
  }

  function downloadOutput() {
    downloadText(output, style === 'markdown' ? 'checklist.md' : 'checklist.txt')
    setMessage('Checklist downloaded')
  }

  function printChecklist() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const items = output
      .split('\n')
      .map((line) => `<li>${line.replace(/^-\s\[\s\]\s|^\[\s\]\s/, '')}</li>`)
      .join('')
    printWindow.document.write(`<html><head><title>Checklist</title></head><body><h1>Checklist</h1><ul>${items}</ul></body></html>`)
    printWindow.document.close()
    printWindow.print()
    setMessage('Checklist opened for printing')
  }

  function resetTool() {
    setInput(sampleLines)
    setStyle('markdown')
    setMessage('Reset checklist builder')
  }

  return (
    <div className="tool-body checklist-tool">
      <section className="checklist-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Lists</p>
            <h3>Checklist builder</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Checklist style">
          <button type="button" className={style === 'markdown' ? 'is-active' : ''} onClick={() => setStyle('markdown')}>
            Markdown
          </button>
          <button type="button" className={style === 'plain' ? 'is-active' : ''} onClick={() => setStyle('plain')}>
            Plain text
          </button>
        </div>

        <label>
          One item per line
          <textarea className="checklist-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyOutput} disabled={!output}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={printChecklist} disabled={!output}>
            Print
          </button>
        </div>

        <p className="helper-text">{message || `${itemCount} checklist items`}</p>
      </section>

      <section className="checklist-output">
        <div className="json-output-title">
          <h3>Output</h3>
          <span className="json-stat">{itemCount} items</span>
        </div>
        <textarea className="code-area" value={output} readOnly spellCheck="false" />
      </section>
    </div>
  )
}
