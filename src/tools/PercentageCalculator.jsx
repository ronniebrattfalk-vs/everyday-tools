import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function numberValue(value) {
  return Number(value) || 0
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'
}

export function PercentageCalculator() {
  const [base, setBase] = useState(120)
  const [comparison, setComparison] = useState(150)
  const [percent, setPercent] = useState(20)
  const [cost, setCost] = useState(80)
  const [price, setPrice] = useState(120)
  const [message, setMessage] = useState('')

  const results = useMemo(() => {
    const baseNumber = numberValue(base)
    const comparisonNumber = numberValue(comparison)
    const percentNumber = numberValue(percent)
    const costNumber = numberValue(cost)
    const priceNumber = numberValue(price)
    const percentOfBase = baseNumber * (percentNumber / 100)
    const change = baseNumber === 0 ? 0 : ((comparisonNumber - baseNumber) / baseNumber) * 100
    const discount = priceNumber * (1 - percentNumber / 100)
    const markup = costNumber === 0 ? 0 : ((priceNumber - costNumber) / costNumber) * 100
    const margin = priceNumber === 0 ? 0 : ((priceNumber - costNumber) / priceNumber) * 100
    const ratio = comparisonNumber === 0 ? 0 : baseNumber / comparisonNumber
    return { change, discount, margin, markup, percentOfBase, ratio }
  }, [base, comparison, cost, percent, price])

  async function copySummary() {
    const summary = [
      `${percent}% of ${base} = ${formatNumber(results.percentOfBase)}`,
      `Change from ${base} to ${comparison} = ${formatNumber(results.change)}%`,
      `${percent}% discount on ${price} = ${formatNumber(results.discount)}`,
      `Markup = ${formatNumber(results.markup)}%`,
      `Margin = ${formatNumber(results.margin)}%`,
      `Ratio = ${formatNumber(results.ratio)}`,
    ].join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Percentage summary copied')
  }

  function resetTool() {
    setBase(120)
    setComparison(150)
    setPercent(20)
    setCost(80)
    setPrice(120)
    setMessage('Reset percentage calculator')
  }

  return (
    <div className="tool-body calculator-tool">
      <section className="calculator-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Math</p>
            <h3>Percentages and ratios</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="form-grid">
          <label>
            Base value
            <input type="number" value={base} onChange={(event) => setBase(event.target.value)} />
          </label>
          <label>
            Comparison value
            <input type="number" value={comparison} onChange={(event) => setComparison(event.target.value)} />
          </label>
          <label>
            Percent
            <input type="number" value={percent} onChange={(event) => setPercent(event.target.value)} />
          </label>
          <label>
            Cost
            <input type="number" value={cost} onChange={(event) => setCost(event.target.value)} />
          </label>
          <label>
            Price
            <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
        </div>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{message || 'Calculate percent of, change, discounts, markup, margin, and ratios.'}</p>
      </section>

      <section className="calculator-results">
        <article>
          <span>{percent}% of {base}</span>
          <strong>{formatNumber(results.percentOfBase)}</strong>
        </article>
        <article>
          <span>Percent change</span>
          <strong>{formatNumber(results.change)}%</strong>
        </article>
        <article>
          <span>Discounted price</span>
          <strong>{formatNumber(results.discount)}</strong>
        </article>
        <article>
          <span>Markup</span>
          <strong>{formatNumber(results.markup)}%</strong>
        </article>
        <article>
          <span>Margin</span>
          <strong>{formatNumber(results.margin)}%</strong>
        </article>
        <article>
          <span>Ratio</span>
          <strong>{formatNumber(results.ratio)}</strong>
        </article>
      </section>
    </div>
  )
}
