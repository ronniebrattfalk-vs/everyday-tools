import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleRecords = `example.com. 3600 IN A 93.184.216.34
www.example.com. 3600 IN CNAME example.com.
example.com. 3600 IN MX 10 mail.example.com.
example.com. 3600 IN TXT "v=spf1 include:_spf.example.com -all"
_dmarc.example.com. 3600 IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"`

const recordNotes = {
  A: 'Maps a hostname to an IPv4 address.',
  AAAA: 'Maps a hostname to an IPv6 address.',
  CNAME: 'Aliases one hostname to another canonical hostname.',
  MX: 'Defines mail exchangers and priority for inbound email.',
  TXT: 'Stores text values, often SPF, DKIM, DMARC, and verification records.',
  NS: 'Delegates DNS authority to name servers.',
  SOA: 'Stores zone authority and serial metadata.',
}

function parseDnsLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return null
  const tokens = trimmed.replaceAll('"', '').split(/\s+/)
  const typeIndex = tokens.findIndex((token) => recordNotes[token.toUpperCase()])
  if (typeIndex === -1) return { name: tokens[0] || 'Unknown', type: 'Unknown', value: trimmed, note: 'Record type was not recognized.' }
  const type = tokens[typeIndex].toUpperCase()
  return {
    name: tokens[0],
    note: recordNotes[type],
    type,
    value: tokens.slice(typeIndex + 1).join(' '),
  }
}

export function DNSLookupHelper() {
  const [records, setRecords] = useState(sampleRecords)
  const [message, setMessage] = useState('')
  const parsed = useMemo(() => records.split(/\r?\n/).map(parseDnsLine).filter(Boolean), [records])

  async function copySummary() {
    const summary = parsed.map((record) => `${record.name} ${record.type}: ${record.value}`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('DNS summary copied')
  }

  function resetTool() {
    setRecords(sampleRecords)
    setMessage('Reset DNS helper')
  }

  return (
    <div className="tool-body dns-tool">
      <section className="network-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">DNS</p>
            <h3>Record explainer</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Pasted DNS records
          <textarea className="headers-textarea" value={records} onChange={(event) => setRecords(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary} disabled={parsed.length === 0}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{message || `${parsed.length} records parsed locally`}</p>
      </section>

      <section className="dns-results">
        {parsed.map((record, index) => (
          <article key={`${record.name}-${record.type}-${index}`}>
            <span>{record.type}</span>
            <strong>{record.name}</strong>
            <code>{record.value}</code>
            <p>{record.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
