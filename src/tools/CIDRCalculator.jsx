import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function ipToNumber(ip) {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null
  return parts.reduce((total, part) => total * 256 + part, 0) >>> 0
}

function numberToIp(number) {
  return [24, 16, 8, 0].map((shift) => (number >>> shift) & 255).join('.')
}

function calculateCidr(value) {
  const [ip, prefixText] = value.trim().split('/')
  const prefix = Number(prefixText)
  const ipNumber = ipToNumber(ip || '')
  if (ipNumber === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { error: 'Enter IPv4 CIDR notation like 192.168.1.0/24.' }
  }

  const hostBits = 32 - prefix
  const size = 2 ** hostBits
  const mask = prefix === 0 ? 0 : (0xffffffff << hostBits) >>> 0
  const wildcard = (~mask) >>> 0
  const network = (ipNumber & mask) >>> 0
  const broadcast = (network + size - 1) >>> 0
  const usable = prefix >= 31 ? size : Math.max(size - 2, 0)
  const firstUsable = prefix >= 31 ? network : network + 1
  const lastUsable = prefix >= 31 ? broadcast : broadcast - 1

  return {
    broadcast: numberToIp(broadcast),
    error: '',
    firstUsable: numberToIp(firstUsable),
    lastUsable: numberToIp(lastUsable),
    mask: numberToIp(mask),
    network: numberToIp(network),
    total: size,
    usable,
    wildcard: numberToIp(wildcard),
  }
}

export function CIDRCalculator() {
  const [cidr, setCidr] = useState('192.168.1.0/24')
  const [message, setMessage] = useState('')
  const result = useMemo(() => calculateCidr(cidr), [cidr])

  async function copySummary() {
    if (result.error) return
    const summary = [
      `CIDR: ${cidr}`,
      `Network: ${result.network}`,
      `Broadcast: ${result.broadcast}`,
      `Subnet mask: ${result.mask}`,
      `Wildcard: ${result.wildcard}`,
      `Usable range: ${result.firstUsable} - ${result.lastUsable}`,
      `Usable hosts: ${result.usable}`,
    ].join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('CIDR summary copied')
  }

  function resetTool() {
    setCidr('192.168.1.0/24')
    setMessage('Reset CIDR calculator')
  }

  return (
    <div className="tool-body network-tool">
      <section className="network-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">IPv4</p>
            <h3>CIDR calculator</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          CIDR block
          <input value={cidr} onChange={(event) => setCidr(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary} disabled={Boolean(result.error)}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{result.error || message || 'Calculate IPv4 subnet ranges locally.'}</p>
      </section>

      <section className="network-results">
        {[
          ['Network', result.network],
          ['Broadcast', result.broadcast],
          ['Subnet mask', result.mask],
          ['Wildcard', result.wildcard],
          ['First usable', result.firstUsable],
          ['Last usable', result.lastUsable],
          ['Total addresses', result.total],
          ['Usable hosts', result.usable],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{result.error ? 'N/A' : value}</strong>
          </article>
        ))}
      </section>
    </div>
  )
}
