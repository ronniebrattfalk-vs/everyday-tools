import { useMemo, useState } from 'react'
import { Download, FileUp, RotateCcw } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function imageToCleanBlob(file, outputType) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    canvas.getContext('2d').drawImage(image, 0, 0)
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not clean image'))
      }, outputType)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function scanHints(text) {
  return [
    ['EXIF', /exif/i.test(text)],
    ['XMP', /xmpmeta|photoshop|adobe/i.test(text)],
    ['GPS', /gps/i.test(text)],
    ['Author', /author|creator|lastModifiedBy/i.test(text)],
    ['Office metadata', /docProps|core\.xml|app\.xml/i.test(text)],
  ].filter(([, present]) => present)
}

export function DocumentMetadataCleaner() {
  const [file, setFile] = useState(null)
  const [hints, setHints] = useState([])
  const [cleaned, setCleaned] = useState(null)
  const [message, setMessage] = useState('')

  const summary = useMemo(() => {
    if (!file) return []
    return [
      ['Name', file.name],
      ['Type', file.type || 'Unknown'],
      ['Size', formatBytes(file.size)],
      ['Modified', new Date(file.lastModified).toLocaleString()],
      ['Detected hints', hints.length ? hints.map(([label]) => label).join(', ') : 'None in quick scan'],
    ]
  }, [file, hints])

  async function inspectFile(nextFile) {
    if (!nextFile) return
    setFile(nextFile)
    setCleaned(null)
    const buffer = await nextFile.slice(0, Math.min(nextFile.size, 512 * 1024)).arrayBuffer()
    const text = new TextDecoder('latin1').decode(buffer)
    setHints(scanHints(text))
    setMessage(`${nextFile.name} inspected locally`)
  }

  async function cleanImage() {
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Metadata removal is currently available for image files.')
      return
    }
    try {
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const blob = await imageToCleanBlob(file, mime)
      const url = URL.createObjectURL(blob)
      setCleaned((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return { blob, extension: mime === 'image/png' ? 'png' : 'jpg', url }
      })
      setMessage('Image re-encoded without embedded metadata')
    } catch (error) {
      setMessage(error.message)
    }
  }

  function downloadCleaned() {
    if (!cleaned || !file) return
    const link = document.createElement('a')
    link.href = cleaned.url
    link.download = `${file.name.replace(/\.[^.]+$/, '') || 'cleaned-file'}-cleaned.${cleaned.extension}`
    link.click()
    setMessage('Cleaned image downloaded')
  }

  function resetTool() {
    if (cleaned?.url) URL.revokeObjectURL(cleaned.url)
    setFile(null)
    setHints([])
    setCleaned(null)
    setMessage('Reset metadata cleaner')
  }

  return (
    <div className="tool-body metadata-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Documents</p>
            <h3>Metadata cleaner</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label className="upload-box">
          <FileUp size={30} aria-hidden="true" />
          <span>{file?.name || 'Choose a file'}</span>
          <small>Inspects common metadata hints. Images can be re-encoded locally.</small>
          <input type="file" onChange={(event) => inspectFile(event.target.files?.[0])} />
        </label>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={cleanImage} disabled={!file?.type.startsWith('image/')}>
            Clean image
          </button>
          <button type="button" className="secondary-button" onClick={downloadCleaned} disabled={!cleaned}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        <p className="helper-text">{message || 'No file selected.'}</p>
      </section>

      <section className="metadata-results">
        {summary.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
        {!file && (
          <div className="empty-state">
            <p>File details appear after upload.</p>
          </div>
        )}
      </section>
    </div>
  )
}
