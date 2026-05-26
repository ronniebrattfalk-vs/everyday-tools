import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

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
    const type = lower === '::1' ? 'Loopback' : lower.startsWith('fe80:') ? 'Link-local' : lower.startsWith('fc') || lower.startsWith('fd') ? 'Unique local' : lower.startsWith('ff') ? 'Multicast' : 'Global or reserved'
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
  const result = useMemo(() => inspectAddress(address), [address])

  async function copySummary() {
    const summary = [`Address: ${result.normalized}`, `Version: ${result.version}`, `Type: ${result.type}`, `Numeric: ${result.numeric}`].join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('IP summary copied')
  }

  function resetTool() {
    setAddress('192.168.1.25')
    setMessage('Reset IP inspector')
  }

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

        <button type="button" className="primary-button" onClick={copySummary} disabled={!result.valid}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

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
    </div>
  )
}
