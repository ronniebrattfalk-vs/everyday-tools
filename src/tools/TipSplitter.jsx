import { useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const fmt = (n) => n.toFixed(2)
const fmtCur = (n) => `$${fmt(n)}`

const QUICK_TIPS = [10, 15, 18, 20, 25]

export function TipSplitter() {
  const [bill, setBill] = useState('80.00')
  const [tipPct, setTipPct] = useState(18)
  const [people, setPeople] = useState(4)
  const [rounding, setRounding] = useState('none')
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const billVal = Math.max(0, parseFloat(bill) || 0)
  const tipAmt = billVal * tipPct / 100
  const rawTotal = billVal + tipAmt
  const rawPerPerson = rawTotal / Math.max(1, people)

  let perPerson = rawPerPerson
  if (rounding === 'up') perPerson = Math.ceil(rawPerPerson * 100) / 100
  else if (rounding === 'down') perPerson = Math.floor(rawPerPerson * 100) / 100
  else if (rounding === 'nearest') perPerson = Math.round(rawPerPerson * 100) / 100

  const roundedTotal = perPerson * Math.max(1, people)
  const roundedTip = roundedTotal - billVal

  async function copy() {
    const text = [
      `Bill: ${fmtCur(billVal)}`,
      `Tip (${tipPct}%): ${fmtCur(roundedTip)}`,
      `Total: ${fmtCur(roundedTotal)}`,
      `Per person (${people}): ${fmtCur(perPerson)}`,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    flash('Copied')
  }

  function reset() {
    setBill('80.00')
    setTipPct(18)
    setPeople(4)
    setRounding('none')
  }

  return (
    <div className="tool-body tip-tool">
      <div className="tip-inputs">
        <label className="field-label">
          Bill amount ($)
          <input
            type="number"
            className="text-input"
            value={bill}
            min="0"
            step="0.01"
            onChange={(e) => setBill(e.target.value)}
            placeholder="0.00"
          />
        </label>

        <div className="field-label">
          Tip — {tipPct}%
          <div className="tip-quick-row">
            {QUICK_TIPS.map((p) => (
              <button
                key={p}
                type="button"
                className={`category-tab ${tipPct === p ? 'active' : ''}`}
                onClick={() => setTipPct(p)}
              >
                {p}%
              </button>
            ))}
          </div>
          <input
            type="range"
            className="tip-slider"
            min="0"
            max="50"
            value={tipPct}
            onChange={(e) => setTipPct(Number(e.target.value))}
          />
        </div>

        <label className="field-label">
          Number of people
          <div className="tip-people-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPeople((p) => Math.max(1, p - 1))}
            >−</button>
            <input
              type="number"
              className="text-input tip-people-input"
              value={people}
              min="1"
              max="50"
              onChange={(e) => setPeople(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => setPeople((p) => Math.min(50, p + 1))}
            >+</button>
          </div>
        </label>

        <div className="field-label">
          Per-person rounding
          <div className="category-tabs compact">
            {[['none', 'None'], ['nearest', 'Nearest ¢'], ['up', 'Round up'], ['down', 'Round down']].map(([val, label]) => (
              <button
                key={val}
                className={rounding === val ? 'active' : ''}
                onClick={() => setRounding(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={copy}>
            <Clipboard size={16} aria-hidden="true" />
            Copy summary
          </button>
        </div>
      </div>

      <div className="tip-results">
        <div className="tip-result-card">
          <div className="tip-result-label">Per person</div>
          <div className="tip-result-big">{fmtCur(perPerson)}</div>
        </div>

        <div className="tip-breakdown">
          <div className="tip-breakdown-row">
            <span>Bill</span>
            <span>{fmtCur(billVal)}</span>
          </div>
          <div className="tip-breakdown-row">
            <span>Tip ({tipPct}%)</span>
            <span>{fmtCur(roundedTip)}</span>
          </div>
          <div className="tip-breakdown-row tip-breakdown-total">
            <span>Total</span>
            <span>{fmtCur(roundedTotal)}</span>
          </div>
          {people > 1 && (
            <div className="tip-breakdown-row">
              <span>Split {people} ways</span>
              <span>{fmtCur(perPerson)} each</span>
            </div>
          )}
        </div>

        <p className="helper-text">{message || ' '}</p>
      </div>
    </div>
  )
}
