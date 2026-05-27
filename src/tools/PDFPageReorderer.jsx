import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Download, FileUp, RotateCcw } from 'lucide-react'

function parsePageOrder(value, pageCount) {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed || trimmed === 'all') return Array.from({ length: pageCount }, (_, index) => index)
  return trimmed.split(',').flatMap((part) => {
    const [startText, endText] = part.trim().split('-')
    const start = Number(startText)
    const end = Number(endText || startText)
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > pageCount) {
      throw new Error(`Invalid page range: ${part.trim()}`)
    }
    const direction = start <= end ? 1 : -1
    const length = Math.abs(end - start) + 1
    return Array.from({ length }, (_, index) => start - 1 + index * direction)
  })
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function PDFPageReorderer() {
  const [file, setFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [pageOrder, setPageOrder] = useState('all')
  const [outputName, setOutputName] = useState('reordered.pdf')
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  async function loadPdf(nextFile) {
    if (!nextFile) return
    try {
      const pdf = await PDFDocument.load(await nextFile.arrayBuffer())
      setFile(nextFile)
      setPageCount(pdf.getPageCount())
      setPageOrder('all')
      setOutputName(nextFile.name.replace(/\.pdf$/i, '-reordered.pdf'))
      setMessage(`${nextFile.name} loaded`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function exportPdf() {
    if (!file) return
    try {
      const source = await PDFDocument.load(await file.arrayBuffer())
      const order = parsePageOrder(pageOrder, source.getPageCount())
      const output = await PDFDocument.create()
      const copiedPages = await output.copyPages(source, order)
      copiedPages.forEach((page) => output.addPage(page))
      downloadBytes(await output.save(), outputName.trim() || 'reordered.pdf')
      setMessage(`${order.length} pages exported`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  function resetTool() {
    setFile(null)
    setPageCount(0)
    setPageOrder('all')
    setOutputName('reordered.pdf')
    setMessage('Reset PDF page reorderer')
  }

  return (
    <div className="tool-body pdf-reorder-tool">
      <section className="pdf-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Documents</p>
            <h3>PDF page reorderer</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label
          className={`upload-box ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); loadPdf(e.dataTransfer.files?.[0]) }}
        >
          <FileUp size={30} aria-hidden="true" />
          <span>{file?.name || 'Choose or drop a PDF'}</span>
          <small>Reorder, reverse, duplicate, or remove pages locally.</small>
          <input type="file" accept="application/pdf" onChange={(event) => loadPdf(event.target.files?.[0])} />
        </label>

        <label>
          Page order
          <input value={pageOrder} onChange={(event) => setPageOrder(event.target.value)} placeholder="all, 1-3, 5, 4-2" />
        </label>

        <label>
          Output filename
          <input value={outputName} onChange={(event) => setOutputName(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={exportPdf} disabled={!file}>
          <Download size={17} aria-hidden="true" />
          Download PDF
        </button>

        <p className="helper-text">{message || 'Use ranges like all, 1-3, 5, 4-2. Duplicate pages by repeating numbers.'}</p>
      </section>

      <section className="network-results">
        <article>
          <span>Pages</span>
          <strong>{pageCount || 'No PDF'}</strong>
        </article>
        <article>
          <span>Example reverse</span>
          <strong>{pageCount ? `${pageCount}-1` : 'Load PDF'}</strong>
        </article>
        <article>
          <span>Remove first page</span>
          <strong>{pageCount > 1 ? `2-${pageCount}` : 'Load PDF'}</strong>
        </article>
        <article>
          <span>Keep odd pages</span>
          <strong>{pageCount ? Array.from({ length: pageCount }, (_, index) => index + 1).filter((page) => page % 2).join(', ') : 'Load PDF'}</strong>
        </article>
      </section>
    </div>
  )
}
