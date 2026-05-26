import { useEffect, useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const samplePem = `-----BEGIN CERTIFICATE-----
MIIBlzCCATygAwIBAgIUToolSampleCertificateForLocalPreviewOnlyMAoGCCqG
SM49BAMCMBUxEzARBgNVBAMMCmV4YW1wbGUuY29tMB4XDTI2MDUyNjAwMDAwMFoX
DTI3MDUyNjAwMDAwMFowFTETMBEGA1UEAwwKZXhhbXBsZS5jb20wWTATBgcqhkjO
PQIBBggqhkjOPQMBBwNCAASampleCertificateBodyForUiPreviewOnly12345678
90abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456owCg
YIKoZIzj0EAwIDRwAwRAIgSampleSignaturePreviewOnlyDoNotUseForRealCert
-----END CERTIFICATE-----`

function pemToBytes(pem) {
  const base64 = pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(':')
}

function extractStrings(bytes) {
  const text = Array.from(bytes)
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' '))
    .join(' ')
  return Array.from(new Set(text.split(/\s+/).filter((value) => value.length >= 4))).slice(0, 16)
}

function extractDates(bytes) {
  const ascii = Array.from(bytes)
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' '))
    .join('')
  return ascii.match(/\d{12}Z|\d{14}Z/g) || []
}

function formatCertDate(value) {
  if (!value) return 'Unknown'
  const year = value.length === 13 ? `20${value.slice(0, 2)}` : value.slice(0, 4)
  const offset = value.length === 13 ? 2 : 4
  return `${year}-${value.slice(offset, offset + 2)}-${value.slice(offset + 2, offset + 4)} ${value.slice(offset + 4, offset + 6)}:${value.slice(offset + 6, offset + 8)} UTC`
}

export function SSLCertificateDecoder() {
  const [pem, setPem] = useState(samplePem)
  const [fingerprint, setFingerprint] = useState('')
  const [message, setMessage] = useState('')

  const decoded = useMemo(() => {
    try {
      const bytes = pemToBytes(pem)
      const dates = extractDates(bytes)
      return {
        byteLength: bytes.byteLength,
        dates,
        error: '',
        strings: extractStrings(bytes),
      }
    } catch (error) {
      return { byteLength: 0, dates: [], error: error.message, strings: [] }
    }
  }, [pem])

  useEffect(() => {
    let cancelled = false
    async function calculateFingerprint() {
      try {
        const bytes = pemToBytes(pem)
        const hash = await crypto.subtle.digest('SHA-256', bytes)
        if (!cancelled) setFingerprint(bytesToHex(hash))
      } catch {
        if (!cancelled) setFingerprint('')
      }
    }
    calculateFingerprint()
    return () => {
      cancelled = true
    }
  }, [pem])

  async function copySummary() {
    const summary = [
      `SHA-256 fingerprint: ${fingerprint || 'Unavailable'}`,
      `Not before: ${formatCertDate(decoded.dates[0])}`,
      `Not after: ${formatCertDate(decoded.dates[1])}`,
      `Detected strings: ${decoded.strings.join(', ') || 'None'}`,
    ].join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Certificate summary copied')
  }

  function resetTool() {
    setPem(samplePem)
    setMessage('Reset certificate decoder')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Certificate</p>
            <h3>SSL decoder</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          PEM certificate
          <textarea className="headers-textarea" value={pem} onChange={(event) => setPem(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary} disabled={Boolean(decoded.error)}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{decoded.error || message || 'Decodes basic local certificate metadata and SHA-256 fingerprint.'}</p>
      </section>

      <section className="headers-results">
        <article className={decoded.error ? 'fails' : 'passes'}>
          <span>SHA-256 fingerprint</span>
          <strong>{fingerprint || 'Unavailable'}</strong>
        </article>
        <article>
          <span>Not before</span>
          <strong>{formatCertDate(decoded.dates[0])}</strong>
        </article>
        <article>
          <span>Not after</span>
          <strong>{formatCertDate(decoded.dates[1])}</strong>
        </article>
        <article>
          <span>DER size</span>
          <strong>{decoded.byteLength ? `${decoded.byteLength} bytes` : 'Unknown'}</strong>
        </article>
        <article>
          <span>Detected names</span>
          <p>{decoded.strings.join(', ') || 'No readable strings detected.'}</p>
        </article>
      </section>
    </div>
  )
}
