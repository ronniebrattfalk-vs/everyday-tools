import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function computeLoan(principal, annualRate, years, extraMonthly = 0) {
  if (principal <= 0 || annualRate < 0 || years <= 0) return null

  const r = annualRate / 100 / 12
  const n = years * 12

  let basePayment
  if (annualRate === 0) {
    basePayment = principal / n
  } else {
    basePayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }

  const monthlyPayment = basePayment + extraMonthly

  // Build amortization schedule
  const schedule = []
  let balance = principal
  let totalInterest = 0
  let month = 0

  while (balance > 0.005 && month < n + 600) {
    month++
    const interest = balance * r
    let principalPaid = monthlyPayment - interest
    if (principalPaid > balance) principalPaid = balance
    balance -= principalPaid
    if (balance < 0.005) balance = 0
    totalInterest += interest

    schedule.push({
      month,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance,
    })

    if (balance === 0) break
  }

  return {
    basePayment,
    monthlyPayment,
    totalMonths: schedule.length,
    totalPaid: schedule.reduce((s, r) => s + r.payment, 0),
    totalInterest,
    schedule,
  }
}

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function cur(n) {
  return `$${fmt(n)}`
}

const PRESETS = [
  { label: 'Home 30yr', principal: 350000, rate: 6.5, years: 30 },
  { label: 'Home 15yr', principal: 350000, rate: 6.0, years: 15 },
  { label: 'Car 5yr', principal: 25000, rate: 7.5, years: 5 },
  { label: 'Personal', principal: 10000, rate: 12.0, years: 3 },
]

export function LoanCalculator() {
  const [principal, setPrincipal] = useState('250000')
  const [rate, setRate] = useState('6.5')
  const [years, setYears] = useState('30')
  const [extra, setExtra] = useState('')
  const [view, setView] = useState('yearly')
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  function applyPreset(p) {
    setPrincipal(String(p.principal))
    setRate(String(p.rate))
    setYears(String(p.years))
    setExtra('')
  }

  const result = useMemo(
    () => computeLoan(parseFloat(principal) || 0, parseFloat(rate) || 0, parseFloat(years) || 0, parseFloat(extra) || 0),
    [principal, rate, years, extra],
  )
  const baseResult = useMemo(
    () => computeLoan(parseFloat(principal) || 0, parseFloat(rate) || 0, parseFloat(years) || 0, 0),
    [principal, rate, years],
  )

  const yearlySchedule = useMemo(() => {
    if (!result) return []
    const byYear = []
    for (let y = 1; y <= Math.ceil(result.schedule.length / 12); y++) {
      const months = result.schedule.slice((y - 1) * 12, y * 12)
      byYear.push({
        year: y,
        payment: months.reduce((s, m) => s + m.payment, 0),
        principal: months.reduce((s, m) => s + m.principal, 0),
        interest: months.reduce((s, m) => s + m.interest, 0),
        balance: months[months.length - 1].balance,
      })
    }
    return byYear
  }, [result])

  async function copySummary() {
    if (!result) return
    const text = [
      `Monthly payment: ${cur(result.monthlyPayment)}`,
      `Total paid: ${cur(result.totalPaid)}`,
      `Total interest: ${cur(result.totalInterest)}`,
      `Payoff: ${result.totalMonths} months (${(result.totalMonths / 12).toFixed(1)} years)`,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    flash('Copied')
  }

  const tableRows = view === 'yearly' ? yearlySchedule : result?.schedule ?? []

  return (
    <div className="tool-body loan-tool">
      <div className="loan-left">
        <div className="section-title-row">
          <span className="section-title">Loan details</span>
          <button type="button" className="secondary-button" onClick={() => { setPrincipal('250000'); setRate('6.5'); setYears('30'); setExtra('') }}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="loan-presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="secondary-button" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        <label className="field-label">
          Loan amount ($)
          <input type="number" className="text-input" value={principal} min="0" step="1000" onChange={(e) => setPrincipal(e.target.value)} />
        </label>
        <label className="field-label">
          Annual interest rate (%)
          <input type="number" className="text-input" value={rate} min="0" max="30" step="0.1" onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="field-label">
          Loan term (years)
          <input type="number" className="text-input" value={years} min="1" max="50" step="1" onChange={(e) => setYears(e.target.value)} />
        </label>
        <label className="field-label">
          Extra monthly payment ($) <span className="helper-text" style={{ margin: 0 }}>optional</span>
          <input type="number" className="text-input" value={extra} min="0" step="10" placeholder="0" onChange={(e) => setExtra(e.target.value)} />
        </label>
      </div>

      <div className="loan-right">
        {result ? (
          <>
            <div className="loan-summary-grid">
              <div className="loan-summary-card">
                <div className="loan-summary-label">Monthly payment</div>
                <div className="loan-summary-value">{cur(result.monthlyPayment)}</div>
              </div>
              <div className="loan-summary-card">
                <div className="loan-summary-label">Total interest</div>
                <div className="loan-summary-value">{cur(result.totalInterest)}</div>
              </div>
              <div className="loan-summary-card">
                <div className="loan-summary-label">Total paid</div>
                <div className="loan-summary-value">{cur(result.totalPaid)}</div>
              </div>
              <div className="loan-summary-card">
                <div className="loan-summary-label">Payoff period</div>
                <div className="loan-summary-value">{(result.totalMonths / 12).toFixed(1)} yrs</div>
              </div>
            </div>

            {parseFloat(extra) > 0 && (
              <p className="helper-text" style={{ marginTop: 0 }}>
                Base payment {cur(result.basePayment)} + {cur(parseFloat(extra))} extra — saves {cur((baseResult?.totalInterest ?? 0) - result.totalInterest)} in interest.
              </p>
            )}

            <div className="section-title-row" style={{ marginTop: 8 }}>
              <div className="category-tabs compact">
                <button className={view === 'yearly' ? 'active' : ''} onClick={() => setView('yearly')}>Yearly</button>
                <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>Monthly</button>
              </div>
              <button type="button" className="secondary-button" onClick={copySummary}>
                <Clipboard size={16} aria-hidden="true" />
                Copy summary
              </button>
            </div>

            <div className="loan-table-wrap">
              <table className="loan-table">
                <thead>
                  <tr>
                    <th>{view === 'yearly' ? 'Year' : 'Month'}</th>
                    <th>Payment</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={view === 'yearly' ? row.year : row.month}>
                      <td>{view === 'yearly' ? row.year : row.month}</td>
                      <td>{cur(row.payment)}</td>
                      <td>{cur(row.principal)}</td>
                      <td>{cur(row.interest)}</td>
                      <td>{cur(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state"><p>Enter loan details to see your payment schedule.</p></div>
        )}

        <p className="helper-text">{message || ' '}</p>
      </div>
    </div>
  )
}
