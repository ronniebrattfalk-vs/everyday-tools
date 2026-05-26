import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleText = 'We need the report today. Please send the final numbers and confirm if anything is blocked.'

function sentenceCase(value) {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed ? `${trimmed[0].toUpperCase()}${trimmed.slice(1)}` : ''
}

function rewriteText(value, tone) {
  const base = sentenceCase(value)
  if (!base) return ''
  if (tone === 'concise') return base.replace(/\bplease\b/gi, '').replace(/\s+/g, ' ').replace(/\.?\s*$/, '.')
  if (tone === 'friendly') return `Hi there, ${base.replace(/\.?$/, '.') } Thanks for taking a look.`
  if (tone === 'formal') return `Please review the following request: ${base.replace(/\.?$/, '.') } I would appreciate your confirmation when complete.`
  if (tone === 'executive') return `Request: ${base.replace(/\.?$/, '.') } Needed outcome: confirmation of status and any blockers.`
  return base
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

export function ToneRewriter() {
  const [input, setInput] = useState(sampleText)
  const [tone, setTone] = useState('friendly')
  const [message, setMessage] = useState('')
  const output = useMemo(() => rewriteText(input, tone), [input, tone])

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setMessage('Rewritten text copied')
  }

  function downloadOutput() {
    downloadText(output, 'rewritten-text.txt')
    setMessage('Rewritten text downloaded')
  }

  function resetTool() {
    setInput(sampleText)
    setTone('friendly')
    setMessage('Reset tone rewriter')
  }

  return (
    <div className="tool-body tone-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Writing</p>
            <h3>Tone rewriter</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Tone">
          {['concise', 'friendly', 'formal', 'executive'].map((item) => (
            <button type="button" key={item} className={tone === item ? 'is-active' : ''} onClick={() => setTone(item)}>
              {item}
            </button>
          ))}
        </div>

        <label>
          Original text
          <textarea className="headers-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
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
        </div>

        <p className="helper-text">{message || 'Template-based rewriting, no AI call or network request.'}</p>
      </section>

      <section className="checklist-output">
        <textarea className="code-area" value={output} readOnly spellCheck="false" />
      </section>
    </div>
  )
}
