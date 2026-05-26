import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleSvg = `<svg width="240" height="140" viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">
  <metadata>Created by a design app</metadata>
  <title>Sample icon</title>
  <desc>A simple SVG preview</desc>
  <rect x="20" y="20" width="200" height="100" rx="12" fill="#2563eb" />
  <circle cx="84" cy="70" r="28" fill="#14b8a6" />
  <path d="M130 88 L164 52 L198 88 Z" fill="#f59e0b" />
</svg>`

function optimizeSvg(value, removeTitles) {
  const parser = new DOMParser()
  const document = parser.parseFromString(value, 'image/svg+xml')
  const svg = document.querySelector('svg')
  if (!svg) return { error: 'Paste valid SVG markup with an <svg> root.', value: '' }

  svg.querySelectorAll('metadata, script, foreignObject').forEach((node) => node.remove())
  if (removeTitles) svg.querySelectorAll('title, desc').forEach((node) => node.remove())
  svg.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('data-') || attribute.name.startsWith('inkscape:') || attribute.name.startsWith('sodipodi:')) {
        node.removeAttribute(attribute.name)
      }
    })
  })

  const serialized = new XMLSerializer().serializeToString(svg)
  const compact = serialized.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim()
  return { error: '', value: DOMPurify.sanitize(compact, { USE_PROFILES: { svg: true, svgFilters: true } }) }
}

function downloadText(value, filename) {
  const blob = new Blob([value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function SVGOptimizer() {
  const [input, setInput] = useState(sampleSvg)
  const [removeTitles, setRemoveTitles] = useState(false)
  const [message, setMessage] = useState('')
  const output = useMemo(() => optimizeSvg(input, removeTitles), [input, removeTitles])
  const saved = output.value ? Math.max(input.length - output.value.length, 0) : 0

  async function copyOutput() {
    if (!output.value) return
    await navigator.clipboard.writeText(output.value)
    setMessage('Optimized SVG copied')
  }

  function downloadOutput() {
    if (!output.value) return
    downloadText(output.value, 'optimized.svg')
    setMessage('Optimized SVG downloaded')
  }

  function resetTool() {
    setInput(sampleSvg)
    setRemoveTitles(false)
    setMessage('Reset SVG optimizer')
  }

  return (
    <div className="tool-body svg-tool">
      <section className="svg-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Design</p>
            <h3>SVG optimizer</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          SVG markup
          <textarea className="headers-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <label className="check-row">
          <input type="checkbox" checked={removeTitles} onChange={(event) => setRemoveTitles(event.target.checked)} />
          Remove title and description
        </label>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyOutput} disabled={!output.value}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output.value}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        <p className="helper-text">{output.error || message || `${saved} characters removed`}</p>
      </section>

      <section className="svg-preview-panel">
        <div className="svg-preview" dangerouslySetInnerHTML={{ __html: output.value }} />
        <textarea className="code-area" value={output.error || output.value} readOnly spellCheck="false" />
      </section>
    </div>
  )
}
