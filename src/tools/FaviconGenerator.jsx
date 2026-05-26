import { useState } from 'react'
import { Download, ImagePlus, RotateCcw } from 'lucide-react'

const sizes = [16, 32, 48, 180, 192, 512]

function canvasToDataUrl(image, size, background) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  context.fillStyle = background
  context.fillRect(0, 0, size, size)
  const scale = Math.min(size / image.width, size / image.height)
  const width = image.width * scale
  const height = image.height * scale
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
  return canvas.toDataURL('image/png')
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export function FaviconGenerator() {
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [background, setBackground] = useState('#ffffff')
  const [message, setMessage] = useState('')

  async function loadImage(file) {
    if (!file) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      setSourceUrl(url)
      setSourceName(file.name)
      setMessage(`${file.name} loaded`)
    }
    image.src = url
  }

  function generateOutputs() {
    if (!sourceUrl) return []
    const image = document.querySelector('.favicon-source-preview')
    if (!image?.complete) return []
    return sizes.map((size) => ({ dataUrl: canvasToDataUrl(image, size, background), size }))
  }

  function downloadSize(size) {
    const item = generateOutputs().find((output) => output.size === size)
    if (!item) return
    downloadDataUrl(item.dataUrl, `favicon-${size}x${size}.png`)
    setMessage(`${size}x${size} favicon downloaded`)
  }

  function downloadAll() {
    generateOutputs().forEach((item) => downloadDataUrl(item.dataUrl, `favicon-${item.size}x${item.size}.png`))
    setMessage('Favicon PNG set downloaded')
  }

  function resetTool() {
    setSourceName('')
    setSourceUrl('')
    setBackground('#ffffff')
    setMessage('Reset favicon generator')
  }

  return (
    <div className="tool-body favicon-tool">
      <section className="favicon-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Design</p>
            <h3>Favicon generator</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label className="upload-box">
          <ImagePlus size={30} aria-hidden="true" />
          <span>{sourceName || 'Choose source image'}</span>
          <small>PNG, JPG, WebP, or SVG image.</small>
          <input type="file" accept="image/*" onChange={(event) => loadImage(event.target.files?.[0])} />
        </label>

        <label>
          Background
          <div className="color-input-row">
            <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
            <input value={background} onChange={(event) => setBackground(event.target.value)} />
          </div>
        </label>

        <button type="button" className="primary-button" onClick={downloadAll} disabled={!sourceUrl}>
          <Download size={17} aria-hidden="true" />
          Download set
        </button>

        <p className="helper-text">{message || 'Creates common PNG favicon and app-icon sizes locally.'}</p>
      </section>

      <section className="favicon-results">
        {sourceUrl ? <img className="favicon-source-preview" src={sourceUrl} alt="" /> : null}
        {sizes.map((size) => (
          <article key={size}>
            <div className="favicon-preview-tile" style={{ width: size > 64 ? 64 : size, height: size > 64 ? 64 : size, background }}>
              {sourceUrl ? <img src={sourceUrl} alt="" /> : null}
            </div>
            <strong>{size}x{size}</strong>
            <button type="button" className="secondary-button" onClick={() => downloadSize(size)} disabled={!sourceUrl}>
              <Download size={16} aria-hidden="true" />
              PNG
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}
