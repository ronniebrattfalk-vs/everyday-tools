import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const dayMs = 24 * 60 * 60 * 1000

function parseDate(value) {
  return new Date(`${value}T00:00:00`)
}

function daysBetween(start, end) {
  return Math.round((parseDate(end) - parseDate(start)) / dayMs)
}

function countBusinessDays(start, end) {
  const direction = daysBetween(start, end) < 0 ? -1 : 1
  let count = 0
  const current = parseDate(start)
  const target = parseDate(end)

  while ((direction > 0 && current < target) || (direction < 0 && current > target)) {
    current.setDate(current.getDate() + direction)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count += direction
  }

  return count
}

function addDays(start, days, businessOnly) {
  const date = parseDate(start)
  const direction = days < 0 ? -1 : 1
  let remaining = Math.abs(days)

  while (remaining > 0) {
    date.setDate(date.getDate() + direction)
    const day = date.getDay()
    if (!businessOnly || (day !== 0 && day !== 6)) remaining -= 1
  }

  return date.toISOString().slice(0, 10)
}

export function DateDifferenceCalculator() {
  const [startDate, setStartDate] = useState('2026-05-26')
  const [endDate, setEndDate] = useState('2026-06-30')
  const [offset, setOffset] = useState(14)
  const [businessOnly, setBusinessOnly] = useState(true)
  const [message, setMessage] = useState('')

  const result = useMemo(() => {
    const calendarDays = daysBetween(startDate, endDate)
    const businessDays = countBusinessDays(startDate, endDate)
    const deadline = addDays(startDate, Number(offset) || 0, businessOnly)
    const weeks = calendarDays / 7
    return { businessDays, calendarDays, deadline, weeks }
  }, [businessOnly, endDate, offset, startDate])

  async function copySummary() {
    const summary = [
      `${startDate} to ${endDate}`,
      `${result.calendarDays} calendar days`,
      `${result.businessDays} business days`,
      `${result.weeks.toFixed(2)} weeks`,
      `Deadline offset: ${result.deadline}`,
    ].join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Date summary copied')
  }

  function resetTool() {
    setStartDate('2026-05-26')
    setEndDate('2026-06-30')
    setOffset(14)
    setBusinessOnly(true)
    setMessage('Reset date calculator')
  }

  return (
    <div className="tool-body calculator-tool">
      <section className="calculator-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Dates</p>
            <h3>Difference and deadline</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="form-grid">
          <label>
            Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            End date
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <label>
            Offset days
            <input type="number" value={offset} onChange={(event) => setOffset(event.target.value)} />
          </label>
          <label className="check-row">
            <input type="checkbox" checked={businessOnly} onChange={(event) => setBusinessOnly(event.target.checked)} />
            Business-day offset
          </label>
        </div>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy summary
        </button>

        <p className="helper-text">{message || 'Calculate durations and simple deadline offsets.'}</p>
      </section>

      <section className="calculator-results">
        <article>
          <span>Calendar days</span>
          <strong>{result.calendarDays}</strong>
        </article>
        <article>
          <span>Business days</span>
          <strong>{result.businessDays}</strong>
        </article>
        <article>
          <span>Weeks</span>
          <strong>{result.weeks.toFixed(2)}</strong>
        </article>
        <article>
          <span>Offset deadline</span>
          <strong>{result.deadline}</strong>
        </article>
      </section>
    </div>
  )
}
