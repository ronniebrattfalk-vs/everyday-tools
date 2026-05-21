import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Clipboard, Download } from 'lucide-react'

export function QRCodeTool() {
  const [value, setValue] = useState('https://example.com')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isCurrent = true

    if (!value.trim()) return

    QRCode.toDataURL(value, {
      width: 320,
      margin: 2,
      color: {
        dark: '#17202a',
        light: '#ffffff',
      },
    }).then((dataUrl) => {
      if (isCurrent) {
        setQrDataUrl(dataUrl)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [value])

  async function copyText() {
    if (!value.trim()) return
    await navigator.clipboard.writeText(value)
    setMessage('Text copied')
  }

  function downloadQrCode() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = 'qr-code.png'
    link.click()
    setMessage('QR code downloaded')
  }

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
            if (!nextValue.trim()) {
              setQrDataUrl('')
            }
            setMessage('')
          }}
          rows={7}
          placeholder="Paste a link, contact detail, Wi-Fi note, or any short text"
        />
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyText}>
            <Clipboard size={17} aria-hidden="true" />
            Copy text
          </button>
          <button type="button" className="primary-button" onClick={downloadQrCode} disabled={!qrDataUrl}>
            <Download size={17} aria-hidden="true" />
            Download PNG
          </button>
        </div>
        <p className="helper-text">{message || 'The QR image updates instantly and stays in your browser.'}</p>
      </div>

      <div className="result-box qr-result" aria-live="polite">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Generated QR code" />
        ) : (
          <p>Enter text to generate a QR code.</p>
        )}
      </div>
    </div>
  )
}
