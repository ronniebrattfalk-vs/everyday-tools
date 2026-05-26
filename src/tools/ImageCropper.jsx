import { useEffect, useRef, useState } from 'react'
import { Download, ImagePlus, RotateCcw, Wand2, XCircle } from 'lucide-react'

const presets = {
  free: { label: 'Free', ratio: null },
  square: { label: '1:1', ratio: 1 },
  portrait: { label: '4:5', ratio: 4 / 5 },
  story: { label: '9:16', ratio: 9 / 16 },
  landscape: { label: '16:9', ratio: 16 / 9 },
  document: { label: 'A4', ratio: 210 / 297 },
}

async function readImage(file) {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.src = url
  await image.decode()
  return { height: image.naturalHeight, image, url, width: image.naturalWidth }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not create cropped image'))
    }, 'image/png')
  })
}

export function ImageCropper() {
  const [sourceFile, setSourceFile] = useState(null)
  const [source, setSource] = useState(null)
  const [preset, setPreset] = useState('square')
  const [crop, setCrop] = useState({ height: 0, width: 0, x: 0, y: 0 })
  const [output, setOutput] = useState(null)
  const [message, setMessage] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    return () => {
      if (source?.url) URL.revokeObjectURL(source.url)
      if (output?.url) URL.revokeObjectURL(output.url)
    }
  }, [output, source])

  function fitCrop(meta, ratio = presets[preset].ratio) {
    if (!ratio) return { height: meta.height, width: meta.width, x: 0, y: 0 }
    let width = meta.width
    let height = Math.round(width / ratio)
    if (height > meta.height) {
      height = meta.height
      width = Math.round(height * ratio)
    }
    return {
      height,
      width,
      x: Math.round((meta.width - width) / 2),
      y: Math.round((meta.height - height) / 2),
    }
  }

  async function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Choose an image file')
      return
    }
    try {
      const meta = await readImage(file)
      setSource((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return meta
      })
      setSourceFile(file)
      setCrop(fitCrop(meta))
      setOutput(null)
      setMessage(`${file.name} loaded`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  function updatePreset(nextPreset) {
    setPreset(nextPreset)
    if (source) setCrop(fitCrop(source, presets[nextPreset].ratio))
  }

  function updateCrop(key, value) {
    if (!source) return
    const numeric = Math.max(0, Math.round(Number(value) || 0))
    setCrop((current) => {
      const next = { ...current, [key]: numeric }
      next.width = Math.max(1, Math.min(next.width, source.width))
      next.height = Math.max(1, Math.min(next.height, source.height))
      next.x = Math.min(next.x, source.width - next.width)
      next.y = Math.min(next.y, source.height - next.height)
      return next
    })
  }

  async function cropImage() {
    if (!source || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = crop.width
    canvas.height = crop.height
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, crop.width, crop.height)
    context.drawImage(source.image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
    const blob = await canvasToBlob(canvas)
    const url = URL.createObjectURL(blob)
    setOutput((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return { blob, url }
    })
    setMessage('Image cropped')
  }

  function downloadOutput() {
    if (!output?.url || !sourceFile) return
    const link = document.createElement('a')
    link.href = output.url
    link.download = `${sourceFile.name.replace(/\.[^.]+$/, '') || 'cropped-image'}-cropped.png`
    link.click()
    setMessage('Cropped image downloaded')
  }

  function resetTool() {
    if (!source) return
    setCrop(fitCrop(source))
    setOutput(null)
    setMessage('Crop reset')
  }

  function clearTool() {
    setSourceFile(null)
    setSource((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
    setOutput((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
    setCrop({ height: 0, width: 0, x: 0, y: 0 })
    setMessage('Image cleared')
  }

  return (
    <div className="tool-body cropper-tool">
      <section className="image-controls">
        <label className="upload-box">
          <ImagePlus size={30} aria-hidden="true" />
          <span>{sourceFile?.name || 'Choose an image'}</span>
          <small>Crop common social, document, and website ratios locally.</small>
          <input type="file" accept="image/*" onChange={(event) => loadFile(event.target.files?.[0])} />
        </label>

        <div className="category-tabs compact" aria-label="Crop aspect ratio">
          {Object.entries(presets).map(([key, item]) => (
            <button type="button" key={key} className={preset === key ? 'is-active' : ''} onClick={() => updatePreset(key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            X
            <input type="number" value={crop.x} onChange={(event) => updateCrop('x', event.target.value)} disabled={!source} />
          </label>
          <label>
            Y
            <input type="number" value={crop.y} onChange={(event) => updateCrop('y', event.target.value)} disabled={!source} />
          </label>
          <label>
            Width
            <input type="number" value={crop.width} onChange={(event) => updateCrop('width', event.target.value)} disabled={!source} />
          </label>
          <label>
            Height
            <input type="number" value={crop.height} onChange={(event) => updateCrop('height', event.target.value)} disabled={!source} />
          </label>
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={cropImage} disabled={!source}>
            <Wand2 size={17} aria-hidden="true" />
            Crop image
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={resetTool} disabled={!source}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={clearTool} disabled={!source}>
            <XCircle size={17} aria-hidden="true" />
            Clear
          </button>
        </div>

        <p className="helper-text">{message || 'No image selected.'}</p>
      </section>

      <section className="cropper-preview-panel">
        <div className="image-stat-grid">
          <div>
            <span>Source</span>
            <strong>{source ? `${source.width}x${source.height}` : '-'}</strong>
          </div>
          <div>
            <span>Crop</span>
            <strong>{source ? `${crop.width}x${crop.height}` : '-'}</strong>
          </div>
          <div>
            <span>Ratio</span>
            <strong>{preset}</strong>
          </div>
        </div>

        <div className="cropper-preview-box">
          {output?.url ? <img src={output.url} alt="Cropped preview" /> : source?.url ? <img src={source.url} alt="Source preview" /> : <p>No image selected yet.</p>}
        </div>

        <canvas ref={canvasRef} hidden />
      </section>
    </div>
  )
}
