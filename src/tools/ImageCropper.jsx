import { useEffect, useMemo, useRef, useState } from 'react'
import Cropper from 'cropperjs'
import { Download, ImagePlus, RotateCcw, Search, Wand2, XCircle } from 'lucide-react'

const presets = {
  free: { label: 'Free', ratio: NaN },
  square: { label: '1:1', ratio: 1 },
  portrait: { label: '4:5', ratio: 4 / 5 },
  story: { label: '9:16', ratio: 9 / 16 },
  landscape: { label: '16:9', ratio: 16 / 9 },
  document: { label: 'A4', ratio: 210 / 297 },
}

function formatRatio(preset) {
  return preset === 'free' ? 'Free' : presets[preset]?.label || 'Custom'
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not create cropped image'))
    }, 'image/png')
  })
}

function getSelectionSnapshot(selection) {
  if (!selection) return { height: 0, width: 0, x: 0, y: 0 }

  return {
    x: Math.round(selection.x),
    y: Math.round(selection.y),
    width: Math.round(selection.width),
    height: Math.round(selection.height),
  }
}

export function ImageCropper() {
  const [sourceFile, setSourceFile] = useState(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceSize, setSourceSize] = useState({ height: 0, width: 0 })
  const [preset, setPreset] = useState('square')
  const [selectionData, setSelectionData] = useState({ height: 0, width: 0, x: 0, y: 0 })
  const [output, setOutput] = useState(null)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const imageRef = useRef(null)
  const previewBoxRef = useRef(null)
  const cropperRef = useRef(null)
  const syncFrameRef = useRef(0)
  const sourceUrlRef = useRef('')
  const outputUrlRef = useRef('')

  useEffect(() => {
    sourceUrlRef.current = sourceUrl
  }, [sourceUrl])

  useEffect(() => {
    outputUrlRef.current = output?.url || ''
  }, [output?.url])

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current)
    if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current)
    cropperRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!sourceUrl || !imageRef.current || !previewBoxRef.current) return undefined

    const cropper = new Cropper(imageRef.current, {
      container: previewBoxRef.current,
    })
    cropperRef.current = cropper

    let cancelled = false

    const applyPreset = () => {
      const selection = cropper.getCropperSelection()
      if (!selection) return
      const ratio = presets[preset]?.ratio
      selection.aspectRatio = ratio
      selection.initialAspectRatio = ratio
      selection.initialCoverage = 0.85
      selection.movable = true
      selection.resizable = true
      selection.zoomable = true
      selection.precise = true
      selection.$reset()
      selection.$center()
      setSelectionData(getSelectionSnapshot(selection))
    }

    const syncSelection = () => {
      if (cancelled) return
      const selection = cropper.getCropperSelection()
      if (selection) {
        setSelectionData((current) => {
          const next = getSelectionSnapshot(selection)
          return current.x === next.x &&
            current.y === next.y &&
            current.width === next.width &&
            current.height === next.height
            ? current
            : next
        })
      }
      syncFrameRef.current = requestAnimationFrame(syncSelection)
    }

    const onReady = () => {
      applyPreset()
      syncSelection()
    }

    if (imageRef.current.complete) {
      onReady()
    } else {
      imageRef.current.addEventListener('load', onReady, { once: true })
    }

    return () => {
      cancelled = true
      if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current)
      cropper.destroy()
      cropperRef.current = null
    }
  }, [sourceUrl, preset])

  const selectionSummary = useMemo(() => {
    if (!selectionData.width || !selectionData.height) return '-'
    return `${selectionData.width}x${selectionData.height}`
  }, [selectionData])

  async function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Choose an image file')
      return
    }

    const nextUrl = URL.createObjectURL(file)
    const image = new Image()
    image.src = nextUrl

    try {
      await image.decode()
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      setSourceUrl(nextUrl)
      setSourceFile(file)
      setSourceSize({ width: image.naturalWidth, height: image.naturalHeight })
      setOutput((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return null
      })
      setMessage(`${file.name} loaded`)
    } catch (error) {
      URL.revokeObjectURL(nextUrl)
      setMessage(error.message || 'Could not load that image')
    }
  }

  function zoomSelection(step) {
    const selection = cropperRef.current?.getCropperSelection()
    selection?.$zoom(step)
  }

  function rotateImage(angle) {
    const image = cropperRef.current?.getCropperImage()
    image?.$rotate(`${angle}deg`)
  }

  async function cropImage() {
    const selection = cropperRef.current?.getCropperSelection()
    if (!selection) return

    try {
      const canvas = await selection.$toCanvas()
      const blob = await canvasToBlob(canvas)
      const url = URL.createObjectURL(blob)
      setOutput((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { blob, url }
      })
      setMessage('Image cropped')
    } catch (error) {
      setMessage(error.message || 'Could not crop that image')
    }
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
    cropperRef.current?.getCropperImage()?.$resetTransform()
    const selection = cropperRef.current?.getCropperSelection()
    if (selection) {
      selection.$reset()
      selection.$center()
      setSelectionData(getSelectionSnapshot(selection))
    }
    setOutput((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
    setMessage('Crop reset')
  }

  function clearTool() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    if (output?.url) URL.revokeObjectURL(output.url)
    cropperRef.current?.destroy()
    cropperRef.current = null
    setSourceFile(null)
    setSourceUrl('')
    setSourceSize({ height: 0, width: 0 })
    setSelectionData({ height: 0, width: 0, x: 0, y: 0 })
    setOutput(null)
    setMessage('Image cleared')
  }

  return (
    <div className="tool-body cropper-tool">
      <section className="image-controls">
        <label
          className={`upload-box ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); loadFile(e.dataTransfer.files?.[0]) }}
        >
          <ImagePlus size={30} aria-hidden="true" />
          <span>{sourceFile?.name || 'Choose or drop an image'}</span>
          <small>Drag the crop box, zoom, rotate, and lock common aspect ratios locally.</small>
          <input type="file" accept="image/*" onChange={(event) => loadFile(event.target.files?.[0])} />
        </label>

        <div className="category-tabs compact" aria-label="Crop aspect ratio">
          {Object.entries(presets).map(([key, item]) => (
            <button type="button" key={key} className={preset === key ? 'is-active' : ''} onClick={() => setPreset(key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="image-stat-grid">
          <div>
            <span>Source</span>
            <strong>{sourceUrl ? `${sourceSize.width}x${sourceSize.height}` : '-'}</strong>
          </div>
          <div>
            <span>Selection</span>
            <strong>{selectionSummary}</strong>
          </div>
          <div>
            <span>Ratio</span>
            <strong>{formatRatio(preset)}</strong>
          </div>
        </div>

        <div className="cropper-adjustments">
          <button type="button" className="secondary-button" onClick={() => zoomSelection(0.1)} disabled={!sourceUrl}>
            <Search size={17} aria-hidden="true" />
            Zoom in
          </button>
          <button type="button" className="secondary-button" onClick={() => zoomSelection(-0.1)} disabled={!sourceUrl}>
            <Search size={17} aria-hidden="true" />
            Zoom out
          </button>
          <button type="button" className="secondary-button" onClick={() => rotateImage(-90)} disabled={!sourceUrl}>
            <RotateCcw size={17} aria-hidden="true" />
            Rotate left
          </button>
          <button type="button" className="secondary-button" onClick={() => rotateImage(90)} disabled={!sourceUrl}>
            <RotateCcw size={17} aria-hidden="true" className="rotate-right-icon" />
            Rotate right
          </button>
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={cropImage} disabled={!sourceUrl}>
            <Wand2 size={17} aria-hidden="true" />
            Crop image
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!output}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={resetTool} disabled={!sourceUrl}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={clearTool} disabled={!sourceUrl}>
            <XCircle size={17} aria-hidden="true" />
            Clear
          </button>
        </div>

        <p className="helper-text">{message || 'No image selected.'}</p>
      </section>

      <section className="cropper-preview-panel">
        <div className="cropper-preview-box" ref={previewBoxRef}>
          {sourceUrl ? <img ref={imageRef} src={sourceUrl} alt="Crop source" className="cropper-source-image" /> : <p>No image selected yet.</p>}
        </div>

        <div className="cropper-output-box">
          {output?.url ? <img src={output.url} alt="Cropped preview" /> : <p>Cropped preview appears here after export.</p>}
        </div>
      </section>
    </div>
  )
}
