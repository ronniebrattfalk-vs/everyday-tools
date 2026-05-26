import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleSpf = 'v=spf1 include:_spf.google.com include:mailgun.org -all'
const sampleDmarc = 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; adkim=s; aspf=s; pct=100'

function analyzeSpf(value) {
  const lower = value.toLowerCase()
  const findings = []
  findings.push({ label: 'SPF version', ok: lower.includes('v=spf1'), note: lower.includes('v=spf1') ? 'SPF version is present.' : 'Missing v=spf1.' })
  findings.push({ label: 'All mechanism', ok: /[~\-?+]all\b/.test(lower), note: /[~\-?+]all\b/.test(lower) ? 'Record has an all mechanism.' : 'Add an all mechanism such as -all or ~all.' })
  findings.push({ label: 'Strict fail', ok: lower.includes('-all'), note: lower.includes('-all') ? 'Uses strict -all.' : 'Consider -all once authorized senders are complete.' })
  findings.push({ label: 'Lookup count hint', ok: (lower.match(/\binclude:|\ba:|\bmx:|\bexists:/g) || []).length <= 10, note: 'SPF DNS lookup limit is 10; this is a simple count hint.' })
  return findings
}

function analyzeDmarc(value) {
  const lower = value.toLowerCase()
  const findings = []
  findings.push({ label: 'DMARC version', ok: lower.includes('v=dmarc1'), note: lower.includes('v=dmarc1') ? 'DMARC version is present.' : 'Missing v=DMARC1.' })
  findings.push({ label: 'Policy', ok: /p=(none|quarantine|reject)/.test(lower), note: /p=(quarantine|reject)/.test(lower) ? 'Enforcement policy is enabled.' : 'p=none is monitoring only.' })
  findings.push({ label: 'Aggregate reports', ok: lower.includes('rua='), note: lower.includes('rua=') ? 'Aggregate report address is configured.' : 'Add rua=mailto:... for reporting.' })
  findings.push({ label: 'Alignment', ok: lower.includes('adkim=s') || lower.includes('aspf=s'), note: lower.includes('adkim=s') || lower.includes('aspf=s') ? 'Strict alignment is partially enabled.' : 'Relaxed alignment is common; strict alignment is optional.' })
  return findings
}

export function SPFDMARCChecker() {
  const [spf, setSpf] = useState(sampleSpf)
  const [dmarc, setDmarc] = useState(sampleDmarc)
  const [message, setMessage] = useState('')
  const findings = useMemo(() => [...analyzeSpf(spf), ...analyzeDmarc(dmarc)], [dmarc, spf])
  const passCount = findings.filter((finding) => finding.ok).length

  async function copySummary() {
    const summary = findings.map((finding) => `${finding.ok ? 'PASS' : 'CHECK'} ${finding.label}: ${finding.note}`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Email auth summary copied')
  }

  function resetTool() {
    setSpf(sampleSpf)
    setDmarc(sampleDmarc)
    setMessage('Reset SPF and DMARC checker')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Email auth</p>
            <h3>SPF and DMARC checker</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          SPF record
          <textarea className="email-auth-textarea" value={spf} onChange={(event) => setSpf(event.target.value)} />
        </label>

        <label>
          DMARC record
          <textarea className="email-auth-textarea" value={dmarc} onChange={(event) => setDmarc(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{message || `${passCount} of ${findings.length} checks passing`}</p>
      </section>

      <section className="headers-results">
        {findings.map((finding) => (
          <article key={finding.label} className={finding.ok ? 'passes' : 'fails'}>
            <span>{finding.ok ? 'Pass' : 'Check'}</span>
            <strong>{finding.label}</strong>
            <p>{finding.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
