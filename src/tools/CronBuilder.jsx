import { useMemo, useState } from 'react'
import { CronExpressionParser } from 'cron-parser'
import { Clipboard, RotateCcw } from 'lucide-react'

const presets = [
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily 09:00', value: '0 9 * * *' },
  { label: 'Weekdays 09:00', value: '0 9 * * 1-5' },
  { label: 'Monthly', value: '0 9 1 * *' },
]

function describeField(value, unit) {
  if (value === '*') return `every ${unit}`
  if (value.startsWith('*/')) return `every ${value.slice(2)} ${unit}s`
  if (value.includes(',')) return `${unit}s ${value}`
  if (value.includes('-')) return `${unit}s ${value}`
  return `${unit} ${value}`
}

function describeCron(expression) {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return 'Use five fields: minute hour day month weekday.'

  const [minute, hour, day, month, weekday] = parts
  return [
    describeField(minute, 'minute'),
    describeField(hour, 'hour'),
    describeField(day, 'day'),
    describeField(month, 'month'),
    describeField(weekday, 'weekday'),
  ].join(', ')
}

function getNextRuns(expression, timezone) {
  try {
    const interval = CronExpressionParser.parse(expression, {
      currentDate: new Date(),
      tz: timezone || undefined,
    })
    return {
      error: '',
      dates: interval.take(8).map((item) => item.toDate()),
    }
  } catch (error) {
    return { error: error.message, dates: [] }
  }
}

export function CronBuilder() {
  const [expression, setExpression] = useState('0 9 * * 1-5')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  const [message, setMessage] = useState('')

  const parsed = useMemo(() => getNextRuns(expression, timezone), [expression, timezone])
  const description = useMemo(() => describeCron(expression), [expression])
  const parts = expression.trim().split(/\s+/)

  function updatePart(index, value) {
    const nextParts = [...parts]
    while (nextParts.length < 5) nextParts.push('*')
    nextParts[index] = value.trim() || '*'
    setExpression(nextParts.slice(0, 5).join(' '))
  }

  async function copyExpression() {
    await navigator.clipboard.writeText(expression)
    setMessage('Cron expression copied')
  }

  function applyPreset(value) {
    setExpression(value)
    setMessage('Preset applied')
  }

  function resetCron() {
    setExpression('0 9 * * 1-5')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
    setMessage('Reset cron builder')
  }

  return (
    <div className="tool-body cron-tool">
      <section className="cron-controls">
        <label>
          Cron expression
          <input value={expression} onChange={(event) => setExpression(event.target.value)} />
        </label>

        <div className="cron-field-grid">
          {['Minute', 'Hour', 'Day', 'Month', 'Weekday'].map((label, index) => (
            <label key={label}>
              {label}
              <input value={parts[index] || '*'} onChange={(event) => updatePart(index, event.target.value)} />
            </label>
          ))}
        </div>

        <label>
          Time zone
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
        </label>

        <div className="regex-snippets">
          {presets.map((preset) => (
            <button type="button" className="secondary-button" key={preset.label} onClick={() => applyPreset(preset.value)}>
              {preset.label}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyExpression}>
            <Clipboard size={17} aria-hidden="true" />
            Copy cron
          </button>
          <button type="button" className="secondary-button" onClick={resetCron}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
        <p className="helper-text">{message || (parsed.error ? `Invalid cron: ${parsed.error}` : description)}</p>
      </section>

      <section className="cron-results">
        <div className="diff-stats" aria-live="polite">
          <span>{parsed.error ? 'invalid' : 'valid'}</span>
          <span>{timezone}</span>
          <span>{parsed.dates.length} runs</span>
        </div>

        <div className="result-list cron-run-list">
          {parsed.dates.length ? (
            parsed.dates.map((date) => (
              <div key={date.toISOString()}>
                <span>{date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <strong>{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: timezone })}</strong>
              </div>
            ))
          ) : (
            <div>
              <span>No runs</span>
              <strong>{parsed.error || 'No upcoming dates found.'}</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
