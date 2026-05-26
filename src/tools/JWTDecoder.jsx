import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleToken = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkV2ZXJ5ZGF5IFRvb2xzIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjQxMDI0NDQ4MDB9',
  'signature-preview-only',
].join('.')

function decodePart(part) {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
  const decoded = atob(padded)
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return 'Not set'
  return new Date(seconds * 1000).toLocaleString()
}

export function JWTDecoder() {
  const [token, setToken] = useState(sampleToken)
  const [message, setMessage] = useState('')
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000))

  const decoded = useMemo(() => {
    try {
      const parts = token.trim().split('.')
      if (parts.length < 2) throw new Error('JWT must include header and payload sections.')
      return {
        header: decodePart(parts[0]),
        payload: decodePart(parts[1]),
        signature: parts[2] || '',
        error: '',
      }
    } catch (error) {
      return { header: null, payload: null, signature: '', error: error.message }
    }
  }, [token])

  const headerText = decoded.header ? JSON.stringify(decoded.header, null, 2) : ''
  const payloadText = decoded.payload ? JSON.stringify(decoded.payload, null, 2) : ''
  const expiresIn = decoded.payload?.exp ? decoded.payload.exp - nowSeconds : null

  async function copyValue(value, label) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copied`)
  }

  function resetTool() {
    setToken(sampleToken)
    setMessage('Reset JWT decoder')
  }

  return (
    <div className="tool-body jwt-tool">
      <section className="jwt-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Local decode only</p>
            <h3>JWT input</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Token
          <textarea className="jwt-textarea" value={token} onChange={(event) => setToken(event.target.value)} />
        </label>

        <div className="jwt-claim-grid">
          <article>
            <span>Algorithm</span>
            <strong>{decoded.header?.alg || 'Unknown'}</strong>
          </article>
          <article>
            <span>Type</span>
            <strong>{decoded.header?.typ || 'Unknown'}</strong>
          </article>
          <article>
            <span>Issued</span>
            <strong>{formatTime(decoded.payload?.iat)}</strong>
          </article>
          <article>
            <span>Expires</span>
            <strong>{formatTime(decoded.payload?.exp)}</strong>
          </article>
        </div>

        <p className="helper-text">
          {decoded.error || message || (expiresIn === null ? 'JWT signatures are not verified here.' : `${expiresIn} seconds until expiry.`)}
        </p>
      </section>

      <section className="jwt-output-grid">
        <article>
          <div className="section-title-row">
            <h3>Header</h3>
            <button type="button" className="icon-button" onClick={() => copyValue(headerText, 'Header')} disabled={!headerText} aria-label="Copy JWT header">
              <Clipboard size={16} aria-hidden="true" />
            </button>
          </div>
          <textarea className="code-area" value={decoded.error ? decoded.error : headerText} readOnly />
        </article>

        <article>
          <div className="section-title-row">
            <h3>Payload</h3>
            <button type="button" className="icon-button" onClick={() => copyValue(payloadText, 'Payload')} disabled={!payloadText} aria-label="Copy JWT payload">
              <Clipboard size={16} aria-hidden="true" />
            </button>
          </div>
          <textarea className="code-area" value={decoded.error ? decoded.error : payloadText} readOnly />
        </article>
      </section>
    </div>
  )
}
