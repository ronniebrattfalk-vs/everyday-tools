import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleSubjects = `Your weekly shipping update is ready
Action needed: confirm your delivery details
Save 20% on tools today only
Quick question about your invoice`

function scoreSubject(subject) {
  const length = subject.length
  const hasNumber = /\d/.test(subject)
  const hasUrgency = /\b(today|now|urgent|action|needed|limited)\b/i.test(subject)
  const hasSpam = /\bfree|guarantee|winner|cash|risk-free|act now\b/i.test(subject)
  let score = 50
  if (length >= 30 && length <= 55) score += 25
  if (length > 70) score -= 20
  if (hasNumber) score += 8
  if (hasUrgency) score += 8
  if (hasSpam) score -= 20
  return {
    length,
    mobilePreview: subject.slice(0, 38),
    note: length > 70 ? 'Likely too long for inbox previews.' : length < 20 ? 'Short and punchy, but may need more context.' : 'Good preview length.',
    score: Math.max(0, Math.min(score, 100)),
  }
}

export function EmailSubjectTester() {
  const [subjects, setSubjects] = useState(sampleSubjects)
  const [message, setMessage] = useState('')
  const results = useMemo(
    () =>
      subjects
        .split(/\r?\n/)
        .map((subject) => subject.trim())
        .filter(Boolean)
        .map((subject) => ({ subject, ...scoreSubject(subject) })),
    [subjects],
  )

  async function copySummary() {
    const summary = results.map((item) => `${item.score}/100 - ${item.subject} (${item.length} chars)`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Subject summary copied')
  }

  function resetTool() {
    setSubjects(sampleSubjects)
    setMessage('Reset subject tester')
  }

  return (
    <div className="tool-body writing-analysis-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Email</p>
            <h3>Subject tester</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          One subject per line
          <textarea className="headers-textarea" value={subjects} onChange={(event) => setSubjects(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary} disabled={results.length === 0}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{message || `${results.length} subject lines compared`}</p>
      </section>

      <section className="subject-results">
        {results.map((item) => (
          <article key={item.subject}>
            <span>{item.score}/100</span>
            <strong>{item.subject}</strong>
            <p>Mobile preview: {item.mobilePreview}</p>
            <p>{item.length} characters. {item.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
