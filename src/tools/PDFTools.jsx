import { useMemo, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Download, FileImage, Files, MoveDown, MoveUp, Scissors, Trash2, XCircle } from 'lucide-react'

const pageSizes = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  Square: [720, 720],
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function normalizePdfName(value, fallback) {
  const clean = value.trim().replace(/[<>:"/\\|?*]+/g, '-')
  const name = clean || fallback
  return name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`
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

function parsePageRanges(value, pageCount) {
  const clean = value.trim()
  if (!clean || clean.toLowerCase() === 'all') {
    return Array.from({ length: pageCount }, (_, index) => index)
  }

  const selected = []
  const seen = new Set()
  const parts = clean.split(',').map((part) => part.trim()).filter(Boolean)

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!match) {
      throw new Error('Use page numbers like 1, 3-5, 8')
    }

    const start = Number(match[1])
    const end = Number(match[2] || match[1])
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      throw new Error(`Pages must be between 1 and ${pageCount}`)
    }
    if (end < start) {
      throw new Error('Page ranges must go from low to high')
    }

    for (let page = start; page <= end; page += 1) {
      const index = page - 1
      if (!seen.has(index)) {
        seen.add(index)
        selected.push(index)
      }
    }
  }

  if (!selected.length) {
    throw new Error('Choose at least one page')
  }

  return selected
}

async function readImageDimensions(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function fitImage(pageWidth, pageHeight, imageWidth, imageHeight, margin) {
  const maxWidth = pageWidth - margin * 2
  const maxHeight = pageHeight - margin * 2
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  return {
    width,
    height,
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
  }
}

export function PDFTools() {
  const [mode, setMode] = useState('images')
  const [images, setImages] = useState([])
  const [pdfs, setPdfs] = useState([])
  const [splitPdf, setSplitPdf] = useState(null)
  const [splitPages, setSplitPages] = useState('all')
  const [pageSize, setPageSize] = useState('A4')
  const [orientation, setOrientation] = useState('portrait')
  const [margin, setMargin] = useState(36)
  const [imageOutputName, setImageOutputName] = useState('images.pdf')
  const [mergeOutputName, setMergeOutputName] = useState('merged.pdf')
  const [splitOutputName, setSplitOutputName] = useState('split.pdf')
  const [message, setMessage] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const totalImageSize = useMemo(() => images.reduce((sum, image) => sum + image.file.size, 0), [images])
  const totalPdfSize = useMemo(() => pdfs.reduce((sum, pdf) => sum + pdf.file.size, 0), [pdfs])

  async function addImages(files) {
    const imageFiles = Array.from(files || []).filter((file) => file.type === 'image/jpeg' || file.type === 'image/png')
    const nextImages = await Promise.all(
      imageFiles.map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        dimensions: await readImageDimensions(file),
      })),
    )
    setImages((current) => [...current, ...nextImages])
    setMessage(nextImages.length ? `${nextImages.length} image${nextImages.length === 1 ? '' : 's'} added` : 'Use PNG or JPG images')
  }

  async function addPdfs(files) {
    const pdfFiles = Array.from(files || []).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    const nextPdfs = pdfFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
    }))
    setPdfs((current) => [...current, ...nextPdfs])
    setMessage(nextPdfs.length ? `${nextPdfs.length} PDF${nextPdfs.length === 1 ? '' : 's'} added` : 'Use PDF files')
  }

  async function addSplitPdf(files) {
    const file = Array.from(files || []).find((item) => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf'))
    if (!file) {
      setMessage('Use one PDF file')
      return
    }

    setIsWorking(true)
    setMessage('Reading PDF')

    try {
      const bytes = await file.arrayBuffer()
      const source = await PDFDocument.load(bytes)
      const pageCount = source.getPageCount()
      setSplitPdf({
        id: crypto.randomUUID(),
        file,
        pageCount,
      })
      setSplitPages('all')
      setSplitOutputName(normalizePdfName(file.name.replace(/\.pdf$/i, '-split'), 'split.pdf'))
      setMessage(`${file.name} loaded with ${pageCount} page${pageCount === 1 ? '' : 's'}`)
    } catch (error) {
      setSplitPdf(null)
      setMessage(`Could not read PDF: ${error.message}`)
    } finally {
      setIsWorking(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (mode === 'images') {
      addImages(event.dataTransfer.files)
    } else if (mode === 'merge') {
      addPdfs(event.dataTransfer.files)
    } else {
      addSplitPdf(event.dataTransfer.files)
    }
  }

  function clearImages() {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setImages([])
    setMessage('Image list cleared')
  }

  function clearPdfs() {
    setPdfs([])
    setMessage('PDF list cleared')
  }

  function clearSplitPdf() {
    setSplitPdf(null)
    setSplitPages('all')
    setMessage('Split PDF cleared')
  }

  function removeImage(id) {
    setImages((current) => {
      const item = current.find((image) => image.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return current.filter((image) => image.id !== id)
    })
  }

  function removePdf(id) {
    setPdfs((current) => current.filter((pdf) => pdf.id !== id))
  }

  function moveItem(setter, id, direction) {
    setter((current) => {
      const index = current.findIndex((item) => item.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const copy = [...current]
      const [item] = copy.splice(index, 1)
      copy.splice(target, 0, item)
      return copy
    })
  }

  async function createPdf() {
    if (!images.length) {
      setMessage('Add at least one image first')
      return
    }

    setIsWorking(true)
    setMessage('Creating PDF')

    try {
      const pdf = await PDFDocument.create()
      const baseSize = pageSizes[pageSize]
      const size = orientation === 'landscape' ? [baseSize[1], baseSize[0]] : baseSize

      for (const image of images) {
        const bytes = await image.file.arrayBuffer()
        const embedded = image.file.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
        const page = pdf.addPage(size)
        const placement = fitImage(size[0], size[1], embedded.width, embedded.height, Number(margin))
        page.drawImage(embedded, placement)
      }

      const pdfBytes = await pdf.save()
      downloadBytes(pdfBytes, normalizePdfName(imageOutputName, 'images.pdf'))
      setMessage(`PDF created with ${images.length} page${images.length === 1 ? '' : 's'}`)
    } catch (error) {
      setMessage(`Could not create PDF: ${error.message}`)
    } finally {
      setIsWorking(false)
    }
  }

  async function mergePdfs() {
    if (!pdfs.length) {
      setMessage('Add at least one PDF first')
      return
    }

    setIsWorking(true)
    setMessage('Merging PDFs')

    try {
      const merged = await PDFDocument.create()

      for (const pdfFile of pdfs) {
        const bytes = await pdfFile.file.arrayBuffer()
        const source = await PDFDocument.load(bytes)
        const copiedPages = await merged.copyPages(source, source.getPageIndices())
        copiedPages.forEach((page) => merged.addPage(page))
      }

      const mergedBytes = await merged.save()
      downloadBytes(mergedBytes, normalizePdfName(mergeOutputName, 'merged.pdf'))
      setMessage(`Merged ${pdfs.length} PDF${pdfs.length === 1 ? '' : 's'}`)
    } catch (error) {
      setMessage(`Could not merge PDFs: ${error.message}`)
    } finally {
      setIsWorking(false)
    }
  }

  async function splitSelectedPdf() {
    if (!splitPdf) {
      setMessage('Add one PDF first')
      return
    }

    setIsWorking(true)
    setMessage('Splitting PDF')

    try {
      const sourceBytes = await splitPdf.file.arrayBuffer()
      const source = await PDFDocument.load(sourceBytes)
      const pageIndices = parsePageRanges(splitPages, source.getPageCount())
      const output = await PDFDocument.create()
      const copiedPages = await output.copyPages(source, pageIndices)
      copiedPages.forEach((page) => output.addPage(page))

      const outputBytes = await output.save()
      downloadBytes(outputBytes, normalizePdfName(splitOutputName, 'split.pdf'))
      setMessage(`Created PDF with ${pageIndices.length} page${pageIndices.length === 1 ? '' : 's'}`)
    } catch (error) {
      setMessage(`Could not split PDF: ${error.message}`)
    } finally {
      setIsWorking(false)
    }
  }

  const activeCount = mode === 'images' ? images.length : mode === 'merge' ? pdfs.length : splitPdf ? 1 : 0
  const activeSize = mode === 'images' ? totalImageSize : mode === 'merge' ? totalPdfSize : splitPdf?.file.size || 0
  const uploadIcon = mode === 'images' ? <FileImage size={30} aria-hidden="true" /> : mode === 'merge' ? <Files size={30} aria-hidden="true" /> : <Scissors size={30} aria-hidden="true" />
  const uploadTitle = mode === 'images' ? 'Add PNG or JPG images' : mode === 'merge' ? 'Add PDF files' : 'Add one PDF to split'
  const uploadHint = mode === 'images' ? 'Each image becomes one PDF page.' : mode === 'merge' ? 'Files are merged in the order shown.' : 'Choose all pages or a range after upload.'

  return (
    <div className="tool-body pdf-tool">
      <section className="pdf-controls">
        <div className="category-tabs compact" aria-label="PDF tool mode">
          <button type="button" className={mode === 'images' ? 'is-active' : ''} onClick={() => setMode('images')}>
            Image to PDF
          </button>
          <button type="button" className={mode === 'merge' ? 'is-active' : ''} onClick={() => setMode('merge')}>
            Merge PDFs
          </button>
          <button type="button" className={mode === 'split' ? 'is-active' : ''} onClick={() => setMode('split')}>
            Split PDF
          </button>
        </div>

        <label
          className={`upload-box ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {uploadIcon}
          <span>{uploadTitle}</span>
          <small>{uploadHint}</small>
          <input
            type="file"
            accept={mode === 'images' ? 'image/png,image/jpeg' : 'application/pdf,.pdf'}
            multiple={mode !== 'split'}
            onChange={(event) => {
              if (mode === 'images') addImages(event.target.files)
              if (mode === 'merge') addPdfs(event.target.files)
              if (mode === 'split') addSplitPdf(event.target.files)
              event.target.value = ''
            }}
          />
        </label>

        {mode === 'images' ? (
          <>
            <div className="form-grid thirds">
              <label>
                Page size
                <select value={pageSize} onChange={(event) => setPageSize(event.target.value)}>
                  <option>A4</option>
                  <option>Letter</option>
                  <option>Square</option>
                </select>
              </label>
              <label>
                Orientation
                <select value={orientation} onChange={(event) => setOrientation(event.target.value)}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
              <label>
                Margin
                <input type="number" min="0" max="120" value={margin} onChange={(event) => setMargin(event.target.value)} />
              </label>
            </div>
            <label>
              Output file name
              <input value={imageOutputName} onChange={(event) => setImageOutputName(event.target.value)} />
            </label>
          </>
        ) : mode === 'merge' ? (
          <label>
            Output file name
            <input value={mergeOutputName} onChange={(event) => setMergeOutputName(event.target.value)} />
          </label>
        ) : (
          <>
            <label>
              Pages
              <input
                value={splitPages}
                onChange={(event) => setSplitPages(event.target.value)}
                placeholder="all or 1-3, 5"
              />
            </label>
            <label>
              Output file name
              <input value={splitOutputName} onChange={(event) => setSplitOutputName(event.target.value)} />
            </label>
          </>
        )}

        <div className="button-row">
          <button
            type="button"
            className="primary-button"
            onClick={mode === 'images' ? createPdf : mode === 'merge' ? mergePdfs : splitSelectedPdf}
            disabled={isWorking || activeCount === 0}
          >
            <Download size={17} aria-hidden="true" />
            {mode === 'images' ? 'Download PDF' : mode === 'merge' ? 'Download merged PDF' : 'Download split PDF'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={mode === 'images' ? clearImages : mode === 'merge' ? clearPdfs : clearSplitPdf}
            disabled={activeCount === 0}
          >
            <XCircle size={17} aria-hidden="true" />
            Clear all
          </button>
        </div>
        <p className="helper-text">
          {message || `${activeCount} file${activeCount === 1 ? '' : 's'} selected - ${formatBytes(activeSize)}`}
        </p>
      </section>

      <section className="pdf-image-list" aria-label={mode === 'images' ? 'Selected images' : mode === 'merge' ? 'Selected PDFs' : 'Selected PDF'}>
        {mode === 'images' ? (
          images.length === 0 ? (
            <div className="empty-state">
              <FileImage size={28} aria-hidden="true" />
              <p>No images selected yet.</p>
            </div>
          ) : (
            images.map((image, index) => (
              <article className="pdf-image-card" key={image.id}>
                <img src={image.previewUrl} alt="" />
                <div>
                  <strong>{image.file.name}</strong>
                  <span>
                    {image.dimensions.width} x {image.dimensions.height} - {formatBytes(image.file.size)}
                  </span>
                </div>
                <div className="pdf-card-actions">
                  <button type="button" className="icon-button" onClick={() => moveItem(setImages, image.id, -1)} disabled={index === 0} aria-label="Move image up">
                    <MoveUp size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-button" onClick={() => moveItem(setImages, image.id, 1)} disabled={index === images.length - 1} aria-label="Move image down">
                    <MoveDown size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-button danger" onClick={() => removeImage(image.id)} aria-label="Remove image">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          )
        ) : mode === 'merge' ? (
          pdfs.length === 0 ? (
          <div className="empty-state">
            <Files size={28} aria-hidden="true" />
            <p>No PDFs selected yet.</p>
          </div>
          ) : (
          pdfs.map((pdf, index) => (
            <article className="pdf-image-card pdf-file-card" key={pdf.id}>
              <div className="pdf-file-icon">
                <Files size={24} aria-hidden="true" />
              </div>
              <div>
                <strong>{pdf.file.name}</strong>
                <span>{formatBytes(pdf.file.size)}</span>
              </div>
              <div className="pdf-card-actions">
                <button type="button" className="icon-button" onClick={() => moveItem(setPdfs, pdf.id, -1)} disabled={index === 0} aria-label="Move PDF up">
                  <MoveUp size={16} aria-hidden="true" />
                </button>
                <button type="button" className="icon-button" onClick={() => moveItem(setPdfs, pdf.id, 1)} disabled={index === pdfs.length - 1} aria-label="Move PDF down">
                  <MoveDown size={16} aria-hidden="true" />
                </button>
                <button type="button" className="icon-button danger" onClick={() => removePdf(pdf.id)} aria-label="Remove PDF">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))
          )
        ) : splitPdf ? (
          <article className="pdf-image-card pdf-file-card" key={splitPdf.id}>
            <div className="pdf-file-icon">
              <Scissors size={24} aria-hidden="true" />
            </div>
            <div>
              <strong>{splitPdf.file.name}</strong>
              <span>
                {splitPdf.pageCount} page{splitPdf.pageCount === 1 ? '' : 's'} - {formatBytes(splitPdf.file.size)}
              </span>
            </div>
            <div className="pdf-card-actions">
              <button type="button" className="icon-button danger" onClick={clearSplitPdf} aria-label="Remove PDF">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ) : (
          <div className="empty-state">
            <Scissors size={28} aria-hidden="true" />
            <p>No PDF selected yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
