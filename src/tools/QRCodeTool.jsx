import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Clipboard, Download } from 'lucide-react'

const QR_OPTIONS = {
  width: 320,
  margin: 2,
  color: { dark: '#17202a', light: '#ffffff' },
}

export function QRCodeTool() {
  const [value, setValue] = useState('https://example.com')
  const [format, setFormat] = useState('png')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isCurrent = true
    if (!value.trim()) return

    if (format === 'svg') {
      QRCode.toString(value, { ...QR_OPTIONS, type: 'svg' }).then((svg) => {
        if (isCurrent) setQrSvg(svg)
      })
    } else {
      QRCode.toDataURL(value, QR_OPTIONS).then((dataUrl) => {
        if (isCurrent) setQrDataUrl(dataUrl)
      })
    }

    return () => { isCurrent = false }
  }, [format, value])

  async function copyText() {
    if (!value.trim()) return
    await navigator.clipboard.writeText(value)
    setMessage('Text copied')
  }

  function downloadQrCode() {
    if (format === 'svg') {
      if (!qrSvg) return
      const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'qr-code.svg'
      link.click()
      URL.revokeObjectURL(url)
      setMessage('SVG downloaded')
    } else {
      if (!qrDataUrl) return
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = 'qr-code.png'
      link.click()
      setMessage('PNG downloaded')
    }
  }

  const svgDataUrl = qrSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}` : ''
  const previewSrc = format === 'svg' ? svgDataUrl : qrDataUrl
  const hasOutput = format === 'svg' ? Boolean(qrSvg) : Boolean(qrDataUrl)

  return (
    <div className="tool-body two-column">
      <div className="control-stack">
        <label htmlFor="qr-value">Text or URL</label>
        <textarea
          id="qr-value"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value
            setValue(nextValue)
            if (!nextValue.trim()) { setQrDataUrl(''); setQrSvg('') }
            setMessage('')
          }}
          rows={7}
          placeholder="Paste a link, contact detail, Wi-Fi note, or any short text"
        />
        <div className="qr-format-switch" aria-label="Output format">
          <button type="button" className={format === 'png' ? 'is-active' : ''} onClick={() => { setFormat('png'); setMessage('') }}>
            PNG
          </button>
          <button type="button" className={format === 'svg' ? 'is-active' : ''} onClick={() => { setFormat('svg'); setMessage('') }}>
            SVG
          </button>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyText}>
            <Clipboard size={17} aria-hidden="true" />
            Copy text
          </button>
          <button type="button" className="primary-button" onClick={downloadQrCode} disabled={!hasOutput}>
            <Download size={17} aria-hidden="true" />
            {format === 'svg' ? 'Download SVG' : 'Download PNG'}
          </button>
        </div>
        <p className="helper-text">{message || 'The QR image updates instantly and stays in your browser.'}</p>
      </div>

      <div className="result-box qr-result" aria-live="polite">
        {previewSrc ? (
          <img src={previewSrc} alt="Generated QR code" />
        ) : (
          <p>Enter text to generate a QR code.</p>
        )}
      </div>
    </div>
  )
}
