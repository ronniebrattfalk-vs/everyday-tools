import { useMemo, useState } from 'react'
import { Clipboard, ExternalLink, Loader2, RotateCcw, Search } from 'lucide-react'

function parseIpv4(value) {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return null
  const octets = parts.map(Number)
  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null
  return octets
}

function classifyIpv4(octets) {
  const [first, second] = octets
  if (first === 10) return 'Private'
  if (first === 172 && second >= 16 && second <= 31) return 'Private'
  if (first === 192 && second === 168) return 'Private'
  if (first === 127) return 'Loopback'
  if (first === 169 && second === 254) return 'Link-local'
  if (first >= 224 && first <= 239) return 'Multicast'
  if (first === 0) return 'Current network'
  if (first >= 240) return 'Reserved'
  return 'Public'
}

function inspectAddress(value) {
  const trimmed = value.trim()
  const ipv4 = parseIpv4(trimmed)
  if (ipv4) {
    return {
      version: 'IPv4',
      type: classifyIpv4(ipv4),
      normalized: ipv4.join('.'),
      numeric: ipv4.reduce((total, part) => total * 256 + part, 0),
      notes: 'IPv4 classification is based on common reserved and private address ranges.',
      valid: true,
    }
  }

  if (/^[0-9a-f:]+$/i.test(trimmed) && trimmed.includes(':')) {
    const lower = trimmed.toLowerCase()
    const type =
      lower === '::1' ? 'Loopback'
      : lower.startsWith('fe80:') ? 'Link-local'
      : lower.startsWith('fc') || lower.startsWith('fd') ? 'Unique local'
      : lower.startsWith('ff') ? 'Multicast'
      : 'Global or reserved'
    return {
      version: 'IPv6',
      type,
      normalized: lower,
      numeric: 'N/A',
      notes: 'IPv6 inspection is classification-only in this browser utility.',
      valid: true,
    }
  }

  return {
    version: 'Unknown',
    type: 'Invalid',
    normalized: trimmed,
    numeric: 'N/A',
    notes: 'Enter a valid IPv4 or IPv6 address.',
    valid: false,
  }
}

export function IPAddressInspector() {
  const [address, setAddress] = useState('192.168.1.25')
  const [message, setMessage] = useState('')
  const [lookupState, setLookupState] = useState(null)
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState(null)
  const result = useMemo(() => inspectAddress(address), [address])

  async function copySummary() {
    const parts = [
      `Address: ${result.normalized}`,
      `Version: ${result.version}`,
      `Type: ${result.type}`,
      `Numeric: ${result.numeric}`,
    ]
    if (lookupResult) {
      if (lookupResult.prefix) parts.push(`Prefix: ${lookupResult.prefix}`)
      if (lookupResult.asn) parts.push(`ASN: ${lookupResult.asn}${lookupResult.asnName ? ` — ${lookupResult.asnName}` : ''}`)
      if (lookupResult.organization) parts.push(`Organization: ${lookupResult.organization}`)
      if (lookupResult.country) parts.push(`Country: ${lookupResult.country}`)
      if (lookupResult.registry) parts.push(`Registry: ${lookupResult.registry}`)
    }
    await navigator.clipboard.writeText(parts.join('\n'))
    setMessage('IP summary copied')
  }

  function resetTool() {
    setAddress('192.168.1.25')
    setMessage('Reset IP inspector')
    setLookupState(null)
    setLookupResult(null)
    setLookupError(null)
  }

  async function doLookup() {
    setLookupState('loading')
    setLookupError(null)
    setLookupResult(null)
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(result.normalized)}`)
      const data = await res.json()
      if (!res.ok) {
        setLookupError(data.error || 'Lookup failed')
        setLookupState('error')
        return
      }
      setLookupResult(data)
      setLookupState('done')
    } catch {
      setLookupError('Network error — lookup unavailable')
      setLookupState('error')
    }
  }

  const canLookup = result.valid && (result.type === 'Public' || result.type === 'Global or reserved')

  return (
    <div className="tool-body network-tool">
      <section className="network-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Network</p>
            <h3>IP address inspector</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          IP address
          <input value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="primary-button" onClick={copySummary} disabled={!result.valid}>
            <Clipboard size={17} aria-hidden="true" />
            Copy summary
          </button>
          {canLookup && (
            <button
              type="button"
              className="secondary-button"
              onClick={doLookup}
              disabled={lookupState === 'loading'}
            >
              {lookupState === 'loading'
                ? <Loader2 size={17} aria-hidden="true" className="ip-lookup-spin" />
                : <Search size={17} aria-hidden="true" />}
              {lookupState === 'loading' ? 'Looking up…' : 'Network lookup'}
            </button>
          )}
        </div>

        <p className="helper-text">{message || result.notes}</p>
      </section>

      <section className="network-results">
        <article>
          <span>Version</span>
          <strong>{result.version}</strong>
        </article>
        <article>
          <span>Classification</span>
          <strong>{result.type}</strong>
        </article>
        <article>
          <span>Normalized</span>
          <strong>{result.normalized || 'N/A'}</strong>
        </article>
        <article>
          <span>IPv4 numeric</span>
          <strong>{result.numeric}</strong>
        </article>
      </section>

      {lookupState === 'error' && (
        <div className="ip-lookup-error">{lookupError}</div>
      )}

      {lookupState === 'done' && lookupResult && (
        <section className="ip-lookup-card">
          <h4 className="ip-lookup-title">Network ownership</h4>
          <div className="ip-lookup-grid">
            {lookupResult.prefix && (
              <div className="ip-lookup-row">
                <span className="ip-lookup-label">Prefix</span>
                <span className="ip-lookup-value">{lookupResult.prefix}</span>
              </div>
            )}
            {lookupResult.asn && (
              <div className="ip-lookup-row">
                <span className="ip-lookup-label">ASN</span>
                <span className="ip-lookup-value">
                  {lookupResult.asn}{lookupResult.asnName ? ` — ${lookupResult.asnName}` : ''}
                </span>
              </div>
            )}
            {lookupResult.organization && (
              <div className="ip-lookup-row">
                <span className="ip-lookup-label">Organization</span>
                <span className="ip-lookup-value">{lookupResult.organization}</span>
              </div>
            )}
            {lookupResult.country && (
              <div className="ip-lookup-row">
                <span className="ip-lookup-label">Country</span>
                <span className="ip-lookup-value">{lookupResult.country}</span>
              </div>
            )}
            {lookupResult.networkName && (
              <div className="ip-lookup-row">
                <span className="ip-lookup-label">Network name</span>
                <span className="ip-lookup-value">{lookupResult.networkName}</span>
              </div>
            )}
            {lookupResult.registry && (
              <div className="ip-lookup-row">
                <span className="ip-lookup-label">Registry</span>
                <span className="ip-lookup-value">{lookupResult.registry}</span>
              </div>
            )}
          </div>
          {lookupResult.links?.length > 0 && (
            <div className="ip-lookup-links">
              {lookupResult.links.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ip-lookup-link"
                >
                  <ExternalLink size={11} aria-hidden="true" />
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
