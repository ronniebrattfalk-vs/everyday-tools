import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleToken = [
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwiaXNzIjoiZXhhbXBsZS1pc3N1ZXIiLCJhdWQiOiJldmVyeWRheS10b29scyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo0MTAyNDQ0ODAwLCJzY29wZSI6InJlYWQ6dG9vbHMgd3JpdGU6ZHJhZnRzIn0',
  '',
].join('.')

function decodeJwtPart(part) {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function formatUnix(seconds) {
  return Number.isFinite(seconds) ? new Date(seconds * 1000).toLocaleString() : 'Missing'
}

function inspectClaims(header, payload, nowSeconds) {
  return [
    {
      label: 'Algorithm',
      ok: header.alg && header.alg.toLowerCase() !== 'none',
      value: header.alg || 'Missing',
      note: header.alg?.toLowerCase() === 'none' ? 'alg=none is risky and should not be accepted by APIs.' : 'Avoid weak or unexpected algorithms.',
    },
    {
      label: 'Expiration',
      ok: Number.isFinite(payload.exp) && payload.exp > nowSeconds,
      value: formatUnix(payload.exp),
      note: Number.isFinite(payload.exp) ? `${payload.exp - nowSeconds} seconds from now.` : 'Tokens should usually include exp.',
    },
    {
      label: 'Issued at',
      ok: Number.isFinite(payload.iat),
      value: formatUnix(payload.iat),
      note: 'iat helps debug token age.',
    },
    {
      label: 'Issuer',
      ok: Boolean(payload.iss),
      value: payload.iss || 'Missing',
      note: 'iss should identify the trusted token issuer.',
    },
    {
      label: 'Audience',
      ok: Boolean(payload.aud),
      value: Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud || 'Missing',
      note: 'aud should match the API or app accepting the token.',
    },
    {
      label: 'Scopes',
      ok: Boolean(payload.scope || payload.scp),
      value: Array.isArray(payload.scp) ? payload.scp.join(', ') : payload.scope || 'Missing',
      note: 'Scopes should be as narrow as practical.',
    },
  ]
}

export function JWTClaimsInspector() {
  const [token, setToken] = useState(sampleToken)
  const [message, setMessage] = useState('')
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000))

  const decoded = useMemo(() => {
    try {
      const [headerPart, payloadPart] = token.trim().split('.')
      if (!headerPart || !payloadPart) throw new Error('JWT must include header and payload sections.')
      const header = decodeJwtPart(headerPart)
      const payload = decodeJwtPart(payloadPart)
      return { error: '', findings: inspectClaims(header, payload, nowSeconds), header, payload }
    } catch (error) {
      return { error: error.message, findings: [], header: null, payload: null }
    }
  }, [nowSeconds, token])

  const passCount = decoded.findings.filter((finding) => finding.ok).length

  async function copySummary() {
    const summary = decoded.findings.map((finding) => `${finding.ok ? 'PASS' : 'CHECK'} ${finding.label}: ${finding.value} - ${finding.note}`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('JWT claim summary copied')
  }

  function resetTool() {
    setToken(sampleToken)
    setMessage('Reset JWT claims inspector')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">JWT claims</p>
            <h3>Risk hints</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Token
          <textarea className="headers-textarea" value={token} onChange={(event) => setToken(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary} disabled={Boolean(decoded.error)}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{decoded.error || message || `${passCount} of ${decoded.findings.length} claim checks passing. Signature is not verified.`}</p>
      </section>

      <section className="headers-results">
        {decoded.findings.map((finding) => (
          <article key={finding.label} className={finding.ok ? 'passes' : 'fails'}>
            <span>{finding.ok ? 'Pass' : 'Check'}</span>
            <strong>{finding.label}</strong>
            <code>{finding.value}</code>
            <p>{finding.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
