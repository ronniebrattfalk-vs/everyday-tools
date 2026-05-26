import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, ImagePlus, RotateCcw, Upload, Wand2, XCircle } from 'lucide-react'

const outputTypes = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg', label: 'JPG' },
  png: { mime: 'image/png', extension: 'png', label: 'PNG' },
  webp: { mime: 'image/webp', extension: 'webp', label: 'WebP' },
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeFileName(fileName, extension) {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*]+/g, '-')
  return `${base || 'resized-image'}.${extension}`
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

export function ImageResizer() {
  const [sourceFile, setSourceFile] = useState(null)
  const [sourceMeta, setSourceMeta] = useState(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockAspect, setLockAspect] = useState(true)
  const [outputFormat, setOutputFormat] = useState('webp')
  const [quality, setQuality] = useState(0.82)
  const [output, setOutput] = useState(null)
  const [message, setMessage] = useState('')
  const canvasRef = useRef(null)

  const outputType = outputTypes[outputFormat]
  const canProcess = sourceFile && Number(width) > 0 && Number(height) > 0

  const compressionLabel = useMemo(() => {
    if (!sourceFile || !output?.blob) return 'No output yet'
    const ratio = 1 - output.blob.size / sourceFile.size
    if (ratio > 0) return `${Math.round(ratio * 100)}% smaller`
    return `${Math.round(Math.abs(ratio) * 100)}% larger`
  }, [output, sourceFile])

  useEffect(() => {
    return () => {
      if (output?.url) URL.revokeObjectURL(output.url)
    }
  }, [output])

  async function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Use a JPG, PNG, or WebP image')
      return
    }

    try {
      const meta = await readImage(file)
      setSourceFile(file)
      setSourceMeta(meta)
      setWidth(String(meta.width))
      setHeight(String(meta.height))
      setOutput(null)
      setMessage(`${file.name} loaded`)
    } catch (error) {
      setMessage(`Could not load image: ${error.message}`)
    }
  }

  function updateWidth(value) {
    setWidth(value)
    if (!lockAspect || !sourceMeta || !Number(value)) return
    setHeight(String(Math.max(1, Math.round((Number(value) / sourceMeta.width) * sourceMeta.height))))
  }

  function updateHeight(value) {
    setHeight(value)
    if (!lockAspect || !sourceMeta || !Number(value)) return
    setWidth(String(Math.max(1, Math.round((Number(value) / sourceMeta.height) * sourceMeta.width))))
  }

  async function processImage() {
    if (!canProcess || !sourceMeta || !canvasRef.current) return

    const nextWidth = Math.max(1, Math.round(Number(width)))
    const nextHeight = Math.max(1, Math.round(Number(height)))
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    canvas.width = nextWidth
    canvas.height = nextHeight
    context.clearRect(0, 0, nextWidth, nextHeight)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(sourceMeta.image, 0, 0, nextWidth, nextHeight)

    try {
      const blob = await canvasToBlob(canvas, outputType.mime, outputFormat === 'png' ? undefined : Number(quality))
      const url = URL.createObjectURL(blob)
      setOutput((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { blob, url, width: nextWidth, height: nextHeight }
      })
      setMessage('Image processed')
    } catch (error) {
      setMessage(error.message)
    }
  }

  function downloadImage() {
    if (!output?.url || !sourceFile) return
    const link = document.createElement('a')
    link.href = output.url
    link.download = normalizeFileName(sourceFile.name, outputType.extension)
    link.click()
    setMessage('Image downloaded')
  }

  function resetImage() {
    if (!sourceMeta) return
    setWidth(String(sourceMeta.width))
    setHeight(String(sourceMeta.height))
    setOutput(null)
    setQuality(0.82)
    setOutputFormat('webp')
    setMessage('Reset image settings')
  }

  function clearImage() {
    setSourceFile(null)
    setSourceMeta(null)
    setWidth('')
    setHeight('')
    setOutput(null)
    setMessage('Image cleared')
  }

  return (
    <div className="tool-body image-tool">
      <section className="image-controls">
        <label className="upload-box">
          <ImagePlus size={30} aria-hidden="true" />
          <span>Add an image</span>
          <small>Resize and compress JPG, PNG, or WebP locally.</small>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => loadFile(event.target.files?.[0])} />
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
              disabled={outputFormat === 'png'}
              onChange={(event) => setQuality(event.target.value)}
            />
          </label>
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={processImage} disabled={!canProcess}>
            <Wand2 size={17} aria-hidden="true" />
            Process image
          </button>
          <button type="button" className="secondary-button" onClick={downloadImage} disabled={!output}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={resetImage} disabled={!sourceFile}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={clearImage} disabled={!sourceFile}>
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
            <strong>{sourceFile ? formatBytes(sourceFile.size) : '-'}</strong>
          </div>
          <div>
            <span>Output</span>
            <strong>{output?.blob ? formatBytes(output.blob.size) : '-'}</strong>
          </div>
          <div>
            <span>Change</span>
            <strong>{compressionLabel}</strong>
          </div>
        </div>

        <div className="image-preview-box">
          {output?.url ? (
            <img src={output.url} alt="Processed preview" />
          ) : sourceFile ? (
            <div className="empty-state">
              <Upload size={28} aria-hidden="true" />
              <p>Process the image to preview the output.</p>
            </div>
          ) : (
            <div className="empty-state">
              <ImagePlus size={28} aria-hidden="true" />
              <p>No image selected yet.</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} hidden />
      </section>
    </div>
  )
}
