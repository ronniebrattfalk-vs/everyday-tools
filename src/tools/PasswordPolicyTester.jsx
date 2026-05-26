import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function analyzePassword(password, policy) {
  return [
    {
      label: `At least ${policy.minLength} characters`,
      ok: password.length >= policy.minLength,
      note: `${password.length} characters entered.`,
    },
    {
      label: 'Uppercase letter',
      ok: !policy.uppercase || /[A-Z]/.test(password),
      note: policy.uppercase ? 'Requires A-Z.' : 'Not required.',
    },
    {
      label: 'Lowercase letter',
      ok: !policy.lowercase || /[a-z]/.test(password),
      note: policy.lowercase ? 'Requires a-z.' : 'Not required.',
    },
    {
      label: 'Number',
      ok: !policy.number || /\d/.test(password),
      note: policy.number ? 'Requires 0-9.' : 'Not required.',
    },
    {
      label: 'Symbol',
      ok: !policy.symbol || /[^A-Za-z0-9]/.test(password),
      note: policy.symbol ? 'Requires a non-alphanumeric character.' : 'Not required.',
    },
    {
      label: 'No obvious repeats',
      ok: !/(.)\1{2,}/.test(password),
      note: 'Flags three or more repeated characters.',
    },
  ]
}

export function PasswordPolicyTester() {
  const [password, setPassword] = useState('CorrectHorseBatteryStaple!42')
  const [policy, setPolicy] = useState({
    lowercase: true,
    minLength: 14,
    number: true,
    symbol: true,
    uppercase: true,
  })
  const [message, setMessage] = useState('')

  const findings = useMemo(() => analyzePassword(password, policy), [password, policy])
  const passCount = findings.filter((finding) => finding.ok).length

  function updatePolicy(key, value) {
    setPolicy((current) => ({ ...current, [key]: value }))
  }

  async function copySummary() {
    const summary = findings.map((finding) => `${finding.ok ? 'PASS' : 'FAIL'} ${finding.label}: ${finding.note}`).join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Policy summary copied')
  }

  function resetTool() {
    setPassword('CorrectHorseBatteryStaple!42')
    setPolicy({ lowercase: true, minLength: 14, number: true, symbol: true, uppercase: true })
    setMessage('Reset password policy tester')
  }

  return (
    <div className="tool-body headers-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Password policy</p>
            <h3>Rule tester</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Password to test
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <label>
          Minimum length
          <input type="number" min="1" max="128" value={policy.minLength} onChange={(event) => updatePolicy('minLength', Number(event.target.value) || 1)} />
        </label>

        <div className="cleaner-options">
          {[
            ['uppercase', 'Uppercase'],
            ['lowercase', 'Lowercase'],
            ['number', 'Number'],
            ['symbol', 'Symbol'],
          ].map(([key, label]) => (
            <label className="check-row" key={key}>
              <input type="checkbox" checked={policy[key]} onChange={(event) => updatePolicy(key, event.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{message || `${passCount} of ${findings.length} rules passing. Password stays local.`}</p>
      </section>

      <section className="headers-results">
        {findings.map((finding) => (
          <article key={finding.label} className={finding.ok ? 'passes' : 'fails'}>
            <span>{finding.ok ? 'Pass' : 'Fail'}</span>
            <strong>{finding.label}</strong>
            <p>{finding.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
