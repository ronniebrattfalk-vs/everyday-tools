import { useEffect, useMemo, useState } from 'react'
import * as exifr from 'exifr'
import { Download, FileUp, RotateCcw } from 'lucide-react'

const METADATA_OPTIONS = {
  tiff: true,
  ifd1: true,
  exif: true,
  gps: true,
  interop: true,
  xmp: { parse: true, multiSegment: true },
  icc: true,
  iptc: true,
  jfif: true,
  ihdr: true,
  userComment: true,
  sanitize: true,
  reviveValues: true,
  translateValues: true,
}

const PRIORITY_FIELDS = [
  ['GPS', ['latitude', 'longitude']],
  ['Camera', ['Make', 'Model']],
  ['Date taken', ['DateTimeOriginal', 'CreateDate', 'DateTimeDigitized']],
  ['Software', ['Software', 'ProcessingSoftware']],
  ['Copyright', ['Copyright', 'Artist', 'Creator']],
]

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'tif', 'tiff', 'heic', 'heif', 'avif'])
const documentExtensions = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt'])
const mediaExtensions = new Set(['mp3', 'wav', 'm4a', 'mp4', 'mov', 'mkv', 'webm'])
const archiveExtensions = new Set(['zip', 'rar', '7z', 'tar', 'gz'])

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(fileName) {
  const match = /\.([^.]+)$/.exec(fileName || '')
  return match?.[1]?.toLowerCase() || ''
}

function getFileCategory(file) {
  const extension = getFileExtension(file?.name)
  const type = file?.type || ''

  if (type.startsWith('image/') || imageExtensions.has(extension)) return 'image'
  if (type.startsWith('audio/') || type.startsWith('video/') || mediaExtensions.has(extension)) return 'media'
  if (type.includes('pdf') || documentExtensions.has(extension)) return 'document'
  if (archiveExtensions.has(extension)) return 'archive'
  if (type.startsWith('text/')) return 'text'
  return 'generic'
}

function formatMetadataValue(value) {
  if (value == null || value === '') return '—'
  if (value instanceof Date) return value.toLocaleString()
  if (Array.isArray(value)) {
    const flat = value.map((item) => formatMetadataValue(item)).filter(Boolean)
    return flat.length ? flat.join(', ') : '—'
  }
  if (value instanceof Uint8Array) return `${value.length} bytes`
  if (typeof value === 'object') return null
  return String(value)
}

function flattenMetadata(value, prefix = '') {
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, nextValue]) => {
    const path = prefix ? `${prefix}.${key}` : key
    const formatted = formatMetadataValue(nextValue)
    if (formatted !== null) {
      return [{ key: path, value: formatted }]
    }
    return flattenMetadata(nextValue, path)
  })
}

function buildSummaryValue(metadata, keys, formatter = (value) => formatMetadataValue(value)) {
  if (!metadata) return '—'

  const found = keys
    .map((key) => metadata[key])
    .filter((value) => value != null && value !== '')

  if (!found.length) return '—'

  return formatter(found)
}

function detectMetadataFamilies(metadataRows) {
  const flags = {
    exif: false,
    gps: false,
    xmp: false,
    iptc: false,
    color: false,
  }

  metadataRows.forEach((row) => {
    const key = row.key.toLowerCase()
    if (key.includes('gps') || key.includes('latitude') || key.includes('longitude')) flags.gps = true
    if (key.includes('xmp') || key.includes('dc.') || key.includes('xml')) flags.xmp = true
    if (key.includes('iptc') || key.includes('caption') || key.includes('keywords')) flags.iptc = true
    if (key.includes('icc') || key.includes('color') || key.includes('profile')) flags.color = true
    if (
      key.includes('date') ||
      key.includes('make') ||
      key.includes('model') ||
      key.includes('lens') ||
      key.includes('iso') ||
      key.includes('exposure')
    ) {
      flags.exif = true
    }
  })

  return flags
}

function buildCleanupSummary(metadataRows) {
  const families = detectMetadataFamilies(metadataRows)
  return [
    families.exif ? 'EXIF camera fields' : null,
    families.gps ? 'GPS coordinates' : null,
    families.xmp ? 'XMP authoring data' : null,
    families.iptc ? 'IPTC editorial fields' : null,
    families.color ? 'embedded color-profile notes' : null,
  ].filter(Boolean)
}

async function readImageDetails(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      megapixels: ((image.naturalWidth * image.naturalHeight) / 1000000).toFixed(2),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
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
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
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

function buildDetailPanels({ file, metadata, metadataRows, fileDetails }) {
  if (!file) return []

  const category = getFileCategory(file)
  const extension = getFileExtension(file.name)
  const cleanupSummary = buildCleanupSummary(metadataRows)
  const familyFlags = detectMetadataFamilies(metadataRows)
  const presentFamilies = [
    familyFlags.exif ? 'EXIF' : null,
    familyFlags.gps ? 'GPS' : null,
    familyFlags.xmp ? 'XMP' : null,
    familyFlags.iptc ? 'IPTC' : null,
    familyFlags.color ? 'Color profile' : null,
  ].filter(Boolean)

  const panels = [
    {
      title: 'Format profile',
      rows: [
        ['Category', category],
        ['Extension', extension || 'Unknown'],
        ['MIME type', file.type || 'Unknown'],
        ['Metadata rows', String(metadataRows.length)],
      ],
    },
    {
      title: 'Cleanup support',
      rows: [
        ['Available today', category === 'image' ? 'Image re-encode and download' : 'Inspection only'],
        ['What cleanup removes', cleanupSummary.length ? cleanupSummary.join(', ') : 'No embedded fields detected'],
        ['Output format', file.type === 'image/png' ? 'PNG' : category === 'image' ? 'JPEG' : '—'],
        ['Notes', category === 'image' ? 'Pixels are preserved, metadata blocks are not copied into the new file.' : 'Non-image formats remain read-only in this browser tool.'],
      ],
    },
    {
      title: 'Metadata families',
      rows: [
        ['Detected', presentFamilies.length ? presentFamilies.join(', ') : 'No known families detected'],
        ['Camera/GPS summary', buildSummaryValue(metadata, ['Make', 'Model', 'latitude'])],
        ['Authorship summary', buildSummaryValue(metadata, ['Artist', 'Creator', 'Copyright', 'Software'])],
        ['Date summary', buildSummaryValue(metadata, ['DateTimeOriginal', 'CreateDate', 'ModifyDate'])],
      ],
    },
  ]

  if (category === 'image') {
    panels.push({
      title: 'Image details',
      rows: [
        ['Dimensions', fileDetails?.width && fileDetails?.height ? `${fileDetails.width} x ${fileDetails.height}px` : 'Unknown'],
        ['Megapixels', fileDetails?.megapixels ? `${fileDetails.megapixels} MP` : 'Unknown'],
        ['Camera', buildSummaryValue(metadata, PRIORITY_FIELDS[1][1], (values) => values.map((value) => formatMetadataValue(value)).join(' / '))],
        ['Location', buildSummaryValue(metadata, PRIORITY_FIELDS[0][1], (values) => {
          if (values.length < 2) return formatMetadataValue(values[0])
          return `${Number(values[0]).toFixed(5)}, ${Number(values[1]).toFixed(5)}`
        })],
      ],
    })
  } else if (category === 'document') {
    panels.push({
      title: 'Document details',
      rows: [
        ['Workflow fit', 'Great for metadata inspection before sharing files'],
        ['Likely fields', extension === 'pdf' ? 'Producer, author, title, creation dates' : 'Authoring, revision, and company details'],
        ['Cleanup support', 'Image-only cleanup is available in this release'],
        ['Recommendation', 'Inspect these files here, then sanitize them in their native authoring app if needed'],
      ],
    })
  } else if (category === 'media') {
    panels.push({
      title: 'Media details',
      rows: [
        ['Likely tags', 'Artist, title, album, capture date, geodata'],
        ['Inspection depth', 'Best-effort metadata hints based on the uploaded file'],
        ['Cleanup support', 'Inspection only'],
        ['Recommendation', 'Use this to confirm whether a file should be scrubbed before sharing'],
      ],
    })
  }

  return panels
}

export function DocumentMetadataCleaner() {
  const [file, setFile] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [fileDetails, setFileDetails] = useState(null)
  const [search, setSearch] = useState('')
  const [cleaned, setCleaned] = useState(null)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => () => {
    if (cleaned?.url) URL.revokeObjectURL(cleaned.url)
  }, [cleaned])

  const metadataRows = useMemo(() => flattenMetadata(metadata), [metadata])
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return metadataRows
    return metadataRows.filter(
      (row) => row.key.toLowerCase().includes(query) || row.value.toLowerCase().includes(query),
    )
  }, [metadataRows, search])

  const summary = useMemo(() => {
    if (!file) return []
    return [
      ['Name', file.name],
      ['Type', file.type || 'Unknown'],
      ['Size', formatBytes(file.size)],
      ['Modified', new Date(file.lastModified).toLocaleString()],
      ['Metadata fields', String(metadataRows.length)],
      [
        'GPS',
        buildSummaryValue(metadata, PRIORITY_FIELDS[0][1], (values) => {
          if (values.length < 2) return formatMetadataValue(values[0])
          return `${Number(values[0]).toFixed(5)}, ${Number(values[1]).toFixed(5)}`
        }),
      ],
      [
        'Camera',
        buildSummaryValue(metadata, PRIORITY_FIELDS[1][1], (values) =>
          values.map((value) => formatMetadataValue(value)).join(' / '),
        ),
      ],
      ['Date taken', buildSummaryValue(metadata, PRIORITY_FIELDS[2][1])],
      ['Software', buildSummaryValue(metadata, PRIORITY_FIELDS[3][1])],
      ['Copyright', buildSummaryValue(metadata, PRIORITY_FIELDS[4][1])],
    ]
  }, [file, metadata, metadataRows.length])

  const detailPanels = useMemo(
    () => buildDetailPanels({ file, metadata, metadataRows, fileDetails }),
    [file, fileDetails, metadata, metadataRows],
  )

  async function inspectFile(nextFile) {
    if (!nextFile) return
    setFile(nextFile)
    setMetadata(null)
    setFileDetails(null)
    setSearch('')
    setCleaned((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })

    try {
      const parsed = (await exifr.parse(nextFile, METADATA_OPTIONS)) || {}
      setMetadata(parsed)

      if (getFileCategory(nextFile) === 'image') {
        try {
          setFileDetails(await readImageDetails(nextFile))
        } catch {
          setFileDetails(null)
        }
      }

      const count = flattenMetadata(parsed).length
      setMessage(count ? `Extracted ${count} metadata fields locally` : 'No embedded metadata found in this file')
    } catch (error) {
      setMetadata(null)
      setMessage(error.message || 'Could not inspect metadata for this file')
    }
  }

  async function cleanImage() {
    if (!file || getFileCategory(file) !== 'image') {
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
    setMetadata(null)
    setFileDetails(null)
    setSearch('')
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

        <label
          className={`upload-box ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); inspectFile(e.dataTransfer.files?.[0]) }}
        >
          <FileUp size={30} aria-hidden="true" />
          <span>{file?.name || 'Choose or drop a file'}</span>
          <small>Reads EXIF, IPTC, and XMP locally. Image files can then be re-encoded without metadata.</small>
          <input type="file" onChange={(event) => inspectFile(event.target.files?.[0])} />
        </label>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={cleanImage} disabled={getFileCategory(file) !== 'image'}>
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
        <div className="metadata-summary-grid">
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
        </div>

        {!!detailPanels.length && (
          <div className="metadata-detail-grid">
            {detailPanels.map((panel) => (
              <article key={panel.title} className="metadata-detail-card">
                <strong>{panel.title}</strong>
                <dl>
                  {panel.rows.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}

        {file && (
          <>
            <label className="metadata-search">
              Search metadata
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search fields or values"
              />
            </label>

            <div className="metadata-table-wrap">
              <table className="metadata-table">
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row">{row.key}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">{metadataRows.length ? 'No metadata rows match your search.' : 'No metadata found.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
