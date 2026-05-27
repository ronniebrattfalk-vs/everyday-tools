import { useMemo, useState } from 'react'
import { addBusinessDays, addDays, differenceInBusinessDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Clipboard, RotateCcw } from 'lucide-react'

function toDate(value) {
  return parseISO(value)
}

function formatIsoDate(value) {
  return format(value, 'yyyy-MM-dd')
}

export function DateDifferenceCalculator() {
  const [startDate, setStartDate] = useState('2026-05-26')
  const [endDate, setEndDate] = useState('2026-06-30')
  const [offset, setOffset] = useState(14)
  const [businessOnly, setBusinessOnly] = useState(true)
  const [message, setMessage] = useState('')

  const result = useMemo(() => {
    const start = toDate(startDate)
    const end = toDate(endDate)
    const calendarDays = differenceInCalendarDays(end, start)
    const businessDays = differenceInBusinessDays(end, start)
    const deadlineDate = businessOnly ? addBusinessDays(start, Number(offset) || 0) : addDays(start, Number(offset) || 0)
    const weeks = calendarDays / 7

    return {
      businessDays,
      calendarDays,
      deadline: formatIsoDate(deadlineDate),
      endLabel: format(end, 'PPP'),
      startLabel: format(start, 'PPP'),
      weeks,
    }
  }, [businessOnly, endDate, offset, startDate])

  async function copySummary() {
    const summary = [
      `${result.startLabel} to ${result.endLabel}`,
      `${result.calendarDays} calendar days`,
      `${result.businessDays} business days`,
      `${result.weeks.toFixed(2)} weeks`,
      `${businessOnly ? 'Business-day' : 'Calendar-day'} deadline offset: ${result.deadline}`,
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

        <p className="helper-text">{message || 'Calculate durations and weekday-aware deadline offsets.'}</p>
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
