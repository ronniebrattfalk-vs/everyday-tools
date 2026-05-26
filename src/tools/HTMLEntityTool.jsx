import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleHtml = '<section class="notice">Tom & Jerry said "Hello" & left.</section>'

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function encodeEntities(value) {
  return value.replace(/[&<>"']/g, (character) => entityMap[character])
}

function decodeEntities(value) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
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

export function HTMLEntityTool() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState(sampleHtml)
  const [message, setMessage] = useState('')

  const output = useMemo(() => (mode === 'encode' ? encodeEntities(input) : decodeEntities(input)), [input, mode])

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setMessage('Output copied')
  }

  function downloadOutput() {
    downloadText(output, mode === 'encode' ? 'encoded-entities.txt' : 'decoded-html.txt')
    setMessage('Output downloaded')
  }

  function swapOutputToInput() {
    setInput(output)
    setMode((current) => (current === 'encode' ? 'decode' : 'encode'))
    setMessage('Moved output to input')
  }

  function resetTool() {
    setMode('encode')
    setInput(sampleHtml)
    setMessage('Reset HTML entity tool')
  }

  return (
    <div className="tool-body entity-tool">
      <section className="entity-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">HTML entities</p>
            <h3>Encode or decode</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="HTML entity mode">
          <button type="button" className={mode === 'encode' ? 'is-active' : ''} onClick={() => setMode('encode')}>
            Encode
          </button>
          <button type="button" className={mode === 'decode' ? 'is-active' : ''} onClick={() => setMode('decode')}>
            Decode
          </button>
        </div>

        <label>
          Input
          <textarea className="entity-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>
      </section>

      <section className="entity-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Output</p>
            <h3>{mode === 'encode' ? 'Encoded text' : 'Decoded text'}</h3>
          </div>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={swapOutputToInput} disabled={!output}>
              Swap
            </button>
            <button type="button" className="secondary-button" onClick={copyOutput} disabled={!output}>
              <Clipboard size={17} aria-hidden="true" />
              Copy
            </button>
            <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output}>
              <Download size={17} aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        <textarea className="entity-textarea output" value={output} readOnly />

        <div className="entity-preview">
          <p className="eyebrow">Plain text preview</p>
          <p>{decodeEntities(output)}</p>
        </div>

        <p className="helper-text">{message || 'Encode markup for display or decode entities back into readable text.'}</p>
      </section>
    </div>
  )
}
