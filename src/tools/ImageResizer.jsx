import { useEffect, useMemo, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import JSZip from 'jszip'
import { Download, ImagePlus, RotateCcw, Upload, Wand2, XCircle } from 'lucide-react'

const outputTypes = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg', label: 'JPG' },
  png: { mime: 'image/png', extension: 'png', label: 'PNG' },
  webp: { mime: 'image/webp', extension: 'webp', label: 'WebP' },
}

const compressionModes = {
  canvas: { label: 'Canvas resize' },
  smart: { label: 'Smart compression' },
  photo: { label: 'Photo compression' },
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatChange(originalBytes, outputBytes) {
  if (!originalBytes || !outputBytes) return 'No output yet'
  const ratio = 1 - outputBytes / originalBytes
  if (ratio > 0) return `${Math.round(ratio * 100)}% smaller`
  if (ratio < 0) return `${Math.round(Math.abs(ratio) * 100)}% larger`
  return 'Same size'
}

function normalizeFileName(fileName, extension) {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*]+/g, '-')
  return `${base || 'resized-image'}.${extension}`
}

function normalizeZipName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*]+/g, '-')
  return `${base || 'resized-images'}.zip`
}

async function readImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not create image output'))
      },
      mime,
      quality,
    )
  })
}

async function processSourceWithCanvas(meta, nextWidth, nextHeight, outputType, quality, canvas) {
  const context = canvas.getContext('2d')
  canvas.width = nextWidth
  canvas.height = nextHeight
  context.clearRect(0, 0, nextWidth, nextHeight)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(meta.image, 0, 0, nextWidth, nextHeight)
  return canvasToBlob(canvas, outputType.mime, outputType.mime === 'image/png' ? undefined : Number(quality))
}

async function processSourceWithCompression(file, nextWidth, nextHeight, outputType, quality, mode) {
  const options =
    mode === 'photo'
      ? {
          maxWidthOrHeight: Math.max(nextWidth, nextHeight),
          initialQuality: Math.min(Number(quality), 0.72),
          maxIteration: 12,
          alwaysKeepResolution: false,
          fileType: outputType.mime,
          useWebWorker: false,
          preserveExif: false,
        }
      : {
          maxWidthOrHeight: Math.max(nextWidth, nextHeight),
          initialQuality: Number(quality),
          fileType: outputType.mime,
          useWebWorker: false,
          preserveExif: false,
        }

  return imageCompression(file, options)
}

export function ImageResizer() {
  const [sourceFiles, setSourceFiles] = useState([])
  const [sourceMetas, setSourceMetas] = useState([])
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockAspect, setLockAspect] = useState(true)
  const [outputFormat, setOutputFormat] = useState('webp')
  const [quality, setQuality] = useState(0.82)
  const [compressionMode, setCompressionMode] = useState('canvas')
  const [output, setOutput] = useState(null)
  const [processedItems, setProcessedItems] = useState([])
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef(null)

  const primaryFile = sourceFiles[0] || null
  const primaryMeta = sourceMetas[0] || null
  const outputType = outputTypes[outputFormat]
  const canProcess = sourceFiles.length > 0 && Number(width) > 0 && Number(height) > 0
  const isBatch = sourceFiles.length > 1
  const totalSourceSize = useMemo(() => sourceFiles.reduce((sum, file) => sum + file.size, 0), [sourceFiles])

  const compressionLabel = useMemo(() => {
    if (!primaryFile || !output?.blob) return 'No output yet'
    return formatChange(primaryFile.size, output.blob.size)
  }, [output, primaryFile])

  useEffect(() => {
    return () => {
      if (output?.url) URL.revokeObjectURL(output.url)
    }
  }, [output])

  async function loadFiles(files) {
    const imageFiles = Array.from(files || []).filter((file) => file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')
    if (!imageFiles.length) {
      setMessage('Use JPG, PNG, or WebP images')
      return
    }

    try {
      const metas = await Promise.all(imageFiles.map((file) => readImage(file)))
      setSourceFiles(imageFiles)
      setSourceMetas(metas)
      setWidth(String(metas[0].width))
      setHeight(String(metas[0].height))
      setProcessedItems([])
      setOutput((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return null
      })
      setMessage(`${imageFiles.length} image${imageFiles.length === 1 ? '' : 's'} loaded`)
    } catch (error) {
      setMessage(`Could not load image: ${error.message}`)
    }
  }

  function updateWidth(value) {
    setWidth(value)
    if (!lockAspect || !primaryMeta || !Number(value)) return
    setHeight(String(Math.max(1, Math.round((Number(value) / primaryMeta.width) * primaryMeta.height))))
  }

  function updateHeight(value) {
    setHeight(value)
    if (!lockAspect || !primaryMeta || !Number(value)) return
    setWidth(String(Math.max(1, Math.round((Number(value) / primaryMeta.height) * primaryMeta.width))))
  }

  async function processOne(index, nextWidth, nextHeight) {
    const blob =
      compressionMode === 'canvas'
        ? await processSourceWithCanvas(sourceMetas[index], nextWidth, nextHeight, outputType, quality, canvasRef.current)
        : await processSourceWithCompression(sourceFiles[index], nextWidth, nextHeight, outputType, quality, compressionMode)

    return {
      blob,
      fileName: normalizeFileName(sourceFiles[index].name, outputType.extension),
      originalBytes: sourceFiles[index].size,
      outputBytes: blob.size,
      width: nextWidth,
      height: nextHeight,
    }
  }

  async function processAllSources() {
    const nextWidth = Math.max(1, Math.round(Number(width)))
    const nextHeight = Math.max(1, Math.round(Number(height)))
    const results = []

    for (const [index] of sourceFiles.entries()) {
      const result = await processOne(index, nextWidth, nextHeight)
      results.push(result)
    }

    setProcessedItems(results)
    return results
  }

  async function processImage() {
    if (!canProcess || !primaryMeta || !canvasRef.current) return

    try {
      const results = await processAllSources()
      const first = results[0]
      const url = URL.createObjectURL(first.blob)
      setOutput((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { blob: first.blob, url, width: first.width, height: first.height }
      })
      setMessage(isBatch ? 'Batch preview processed with per-file size comparison' : 'Image processed')
    } catch (error) {
      setMessage(error.message)
    }
  }

  function downloadImage() {
    if (!output?.url || !primaryFile) return
    const link = document.createElement('a')
    link.href = output.url
    link.download = normalizeFileName(primaryFile.name, outputType.extension)
    link.click()
    setMessage('Image downloaded')
  }

  async function downloadBatchZip() {
    if (!canProcess || !sourceMetas.length || !canvasRef.current) return

    try {
      const results = processedItems.length === sourceFiles.length ? processedItems : await processAllSources()
      const zip = new JSZip()
      results.forEach((result) => {
        zip.file(result.fileName, result.blob)
      })
      const archive = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(archive)
      const link = document.createElement('a')
      link.href = url
      link.download = normalizeZipName(`resized-${outputType.extension}`)
      link.click()
      URL.revokeObjectURL(url)
      setMessage(`ZIP downloaded with ${sourceFiles.length} resized images`)
    } catch (error) {
      setMessage(`Could not build ZIP: ${error.message}`)
    }
  }

  function resetImage() {
    if (!primaryMeta) return
    setWidth(String(primaryMeta.width))
    setHeight(String(primaryMeta.height))
    setOutput((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
    setProcessedItems([])
    setQuality(0.82)
    setOutputFormat('webp')
    setCompressionMode('canvas')
    setMessage('Reset image settings')
  }

  function clearImage() {
    setSourceFiles([])
    setSourceMetas([])
    setWidth('')
    setHeight('')
    setProcessedItems([])
    setOutput((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
    setMessage('Image list cleared')
  }

  return (
    <div className="tool-body image-tool">
      <section className="image-controls">
        <label
          className={`upload-box ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); loadFiles(e.dataTransfer.files) }}
        >
          <ImagePlus size={30} aria-hidden="true" />
          <span>{isBatch ? 'Drop or add more images' : 'Drop or add image files'}</span>
          <small>Resize locally with canvas export, smart compression, or a photo-tuned compression pass.</small>
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => loadFiles(event.target.files)} />
        </label>

        <div className="form-grid">
          <label>
            Width
            <input type="number" min="1" value={width} onChange={(event) => updateWidth(event.target.value)} />
          </label>
          <label>
            Height
            <input type="number" min="1" value={height} onChange={(event) => updateHeight(event.target.value)} />
          </label>
        </div>

        <label className="check-row">
          <input type="checkbox" checked={lockAspect} onChange={(event) => setLockAspect(event.target.checked)} />
          Lock aspect ratio
        </label>

        <div className="form-grid">
          <label>
            Format
            <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)}>
              {Object.entries(outputTypes).map(([value, item]) => (
                <option value={value} key={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quality
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.01"
              value={quality}
              disabled={outputFormat === 'png' && compressionMode === 'canvas'}
              onChange={(event) => setQuality(event.target.value)}
            />
          </label>
        </div>

        <div className="category-tabs compact" aria-label="Compression mode">
          {Object.entries(compressionModes).map(([key, item]) => (
            <button type="button" key={key} className={compressionMode === key ? 'is-active' : ''} onClick={() => setCompressionMode(key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={processImage} disabled={!canProcess}>
            <Wand2 size={17} aria-hidden="true" />
            {isBatch ? 'Process preview' : 'Process image'}
          </button>
          <button type="button" className="secondary-button" onClick={isBatch ? downloadBatchZip : downloadImage} disabled={isBatch ? !canProcess : !output}>
            <Download size={17} aria-hidden="true" />
            {isBatch ? 'Download ZIP' : 'Download'}
          </button>
          <button type="button" className="secondary-button" onClick={resetImage} disabled={!primaryFile}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={clearImage} disabled={!primaryFile}>
            <XCircle size={17} aria-hidden="true" />
            Clear
          </button>
        </div>

        <p className="helper-text">{message || 'No image selected.'}</p>
      </section>

      <section className="image-preview-panel">
        <div className="image-stat-grid">
          <div>
            <span>Original</span>
            <strong>{sourceFiles.length ? formatBytes(isBatch ? totalSourceSize : primaryFile.size) : '-'}</strong>
          </div>
          <div>
            <span>{isBatch ? 'Files' : 'Output'}</span>
            <strong>{isBatch ? sourceFiles.length : output?.blob ? formatBytes(output.blob.size) : '-'}</strong>
          </div>
          <div>
            <span>Change</span>
            <strong>{isBatch ? 'Per-file comparison below' : compressionLabel}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>{compressionModes[compressionMode].label}</strong>
          </div>
        </div>

        <div className="image-preview-box">
          {output?.url ? (
            <img src={output.url} alt="Processed preview" />
          ) : primaryFile ? (
            <div className="empty-state">
              <Upload size={28} aria-hidden="true" />
              <p>{isBatch ? 'Process the images to preview the first output and compare each file below.' : 'Process the image to preview the output.'}</p>
            </div>
          ) : (
            <div className="empty-state">
              <ImagePlus size={28} aria-hidden="true" />
              <p>No image selected yet.</p>
            </div>
          )}
        </div>

        {sourceFiles.length > 0 && (
          <div className="image-batch-list" aria-label="Selected images and size comparisons">
            {sourceFiles.map((file, index) => {
              const processed = processedItems[index]
              return (
                <article key={`${file.name}-${index}`} className="image-batch-card">
                  <strong>{file.name}</strong>
                  <span>{sourceMetas[index] ? `${sourceMetas[index].width} x ${sourceMetas[index].height}` : 'Loading dimensions'}</span>
                  <span>
                    {formatBytes(file.size)}
                    {processed ? ` -> ${formatBytes(processed.outputBytes)} (${formatChange(file.size, processed.outputBytes)})` : ''}
                  </span>
                </article>
              )
            })}
          </div>
        )}

        <canvas ref={canvasRef} hidden />
      </section>
    </div>
  )
}
