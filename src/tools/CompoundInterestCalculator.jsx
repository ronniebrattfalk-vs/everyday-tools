import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function computeCompound(principal, annualRate, years, monthlyContrib) {
  if (years <= 0 || principal < 0) return null
  const r = annualRate / 100 / 12
  const months = Math.round(years * 12)
  const rows = []
  let balance = principal
  let totalContrib = principal

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) + monthlyContrib
    totalContrib += monthlyContrib

    if (m % 12 === 0) {
      rows.push({
        year: m / 12,
        balance,
        totalContrib,
        interest: balance - totalContrib,
      })
    }
  }

  // Partial year
  const rem = months % 12
  if (rem > 0) {
    rows.push({
      year: +(years).toFixed(2),
      balance,
      totalContrib,
      interest: balance - totalContrib,
    })
  }

  return { balance, totalContrib, interest: balance - totalContrib, rows }
}

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function cur(n) {
  return `$${fmt(n)}`
}

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('10000')
  const [rate, setRate] = useState('7')
  const [years, setYears] = useState('20')
  const [monthly, setMonthly] = useState('200')
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const result = useMemo(
    () =>
      computeCompound(
        parseFloat(principal) || 0,
        parseFloat(rate) || 0,
        parseFloat(years) || 0,
        parseFloat(monthly) || 0,
      ),
    [principal, rate, years, monthly],
  )

  const noContribResult = useMemo(
    () => computeCompound(parseFloat(principal) || 0, parseFloat(rate) || 0, parseFloat(years) || 0, 0),
    [principal, rate, years],
  )

  async function copySummary() {
    if (!result) return
    const text = [
      `Starting amount: ${cur(parseFloat(principal) || 0)}`,
      `Monthly contribution: ${cur(parseFloat(monthly) || 0)}`,
      `Annual rate: ${rate}%`,
      `Period: ${years} years`,
      `Final balance: ${cur(result.balance)}`,
      `Total contributed: ${cur(result.totalContrib)}`,
      `Interest earned: ${cur(result.interest)}`,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    flash('Copied')
  }

  const contribMonthly = parseFloat(monthly) || 0

  return (
    <div className="tool-body compound-tool">
      <div className="compound-left">
        <div className="section-title-row">
          <span className="section-title">Parameters</span>
          <button type="button" className="secondary-button" onClick={() => { setPrincipal('10000'); setRate('7'); setYears('20'); setMonthly('200') }}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label className="field-label">
          Starting amount ($)
          <input type="number" className="text-input" value={principal} min="0" step="1000" onChange={(e) => setPrincipal(e.target.value)} />
        </label>
        <label className="field-label">
          Annual interest rate (%)
          <input type="number" className="text-input" value={rate} min="0" max="50" step="0.1" onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="field-label">
          Investment period (years)
          <input type="number" className="text-input" value={years} min="1" max="100" step="1" onChange={(e) => setYears(e.target.value)} />
        </label>
        <label className="field-label">
          Monthly contribution ($)
          <input type="number" className="text-input" value={monthly} min="0" step="50" placeholder="0" onChange={(e) => setMonthly(e.target.value)} />
        </label>

        <p className="helper-text">Compounded monthly. Interest is reinvested.</p>
      </div>

      <div className="compound-right">
        {result ? (
          <>
            <div className="compound-summary">
              <div className="compound-summary-card highlight">
                <div className="compound-summary-label">Final balance</div>
                <div className="compound-summary-value">{cur(result.balance)}</div>
              </div>
              <div className="compound-summary-card">
                <div className="compound-summary-label">Total contributed</div>
                <div className="compound-summary-value">{cur(result.totalContrib)}</div>
              </div>
              <div className="compound-summary-card">
                <div className="compound-summary-label">Interest earned</div>
                <div className="compound-summary-value">{cur(result.interest)}</div>
              </div>
              {contribMonthly > 0 && noContribResult && (
                <div className="compound-summary-card">
                  <div className="compound-summary-label">Without contributions</div>
                  <div className="compound-summary-value">{cur(noContribResult.balance)}</div>
                </div>
              )}
            </div>

            <div className="section-title-row" style={{ marginTop: 8 }}>
              <span className="section-title">Year-by-year growth</span>
              <button type="button" className="secondary-button" onClick={copySummary}>
                <Clipboard size={16} aria-hidden="true" />
                Copy summary
              </button>
            </div>

            <div className="compound-table-wrap">
              <table className="compound-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Balance</th>
                    <th>Contributed</th>
                    <th>Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{cur(row.balance)}</td>
                      <td>{cur(row.totalContrib)}</td>
                      <td>{cur(row.interest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state"><p>Enter parameters to calculate compound growth.</p></div>
        )}

        <p className="helper-text">{message || ' '}</p>
      </div>
    </div>
  )
}
