import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const timeZones = [
  { label: 'Local browser time', value: undefined },
  { label: 'UTC', value: 'UTC' },
  { label: 'Stockholm', value: 'Europe/Stockholm' },
  { label: 'London', value: 'Europe/London' },
  { label: 'New York', value: 'America/New_York' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
]

function toDateTimeLocal(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function formatDate(date, timeZone) {
  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone,
  }).format(date)
}

function timestampFromInput(value) {
  if (!value.trim()) return Number.NaN
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return Number.NaN
  return Math.abs(numericValue) > 9999999999 ? numericValue : numericValue * 1000
}

export function TimestampConverter() {
  const [timestampInput, setTimestampInput] = useState(() => Math.floor(Date.now() / 1000).toString())
  const [dateTimeInput, setDateTimeInput] = useState(() => toDateTimeLocal(new Date()))
  const [timeZone, setTimeZone] = useState(undefined)
  const [message, setMessage] = useState('')

  const date = useMemo(() => new Date(timestampFromInput(timestampInput)), [timestampInput])
  const isValid = !Number.isNaN(date.getTime())

  function syncFromTimestamp(value) {
    setTimestampInput(value)
    const nextDate = new Date(timestampFromInput(value))
    if (!Number.isNaN(nextDate.getTime())) {
      setDateTimeInput(toDateTimeLocal(nextDate))
    }
    setMessage('')
  }

  function syncFromDateTime(value) {
    setDateTimeInput(value)
    const nextDate = new Date(value)
    if (!Number.isNaN(nextDate.getTime())) {
      setTimestampInput(Math.floor(nextDate.getTime() / 1000).toString())
    }
    setMessage('')
  }

  function setNow() {
    const now = new Date()
    setTimestampInput(Math.floor(now.getTime() / 1000).toString())
    setDateTimeInput(toDateTimeLocal(now))
    setMessage('Set to current time')
  }

  async function copySummary() {
    if (!isValid) return
    await navigator.clipboard.writeText(
      [
        `Unix seconds: ${Math.floor(date.getTime() / 1000)}`,
        `Unix milliseconds: ${date.getTime()}`,
        `ISO: ${date.toISOString()}`,
        `Selected zone: ${formatDate(date, timeZone)}`,
      ].join('\n'),
    )
    setMessage('Timestamp details copied')
  }

  return (
    <div className="tool-body">
      <div className="split-controls">
        <div className="control-stack">
          <label htmlFor="unix-timestamp">Unix timestamp</label>
          <input
            id="unix-timestamp"
            value={timestampInput}
            onChange={(event) => syncFromTimestamp(event.target.value)}
            inputMode="numeric"
            placeholder="Seconds or milliseconds"
          />
        </div>

        <div className="control-stack">
          <label htmlFor="local-date-time">Local date and time</label>
          <input
            id="local-date-time"
            type="datetime-local"
            value={dateTimeInput}
            onChange={(event) => syncFromDateTime(event.target.value)}
          />
        </div>
      </div>

      <div className="split-controls timestamp-controls">
        <div className="control-stack">
          <label htmlFor="time-zone">Display time zone</label>
          <select
            id="time-zone"
            value={timeZone ?? 'local'}
            onChange={(event) => setTimeZone(event.target.value === 'local' ? undefined : event.target.value)}
          >
            {timeZones.map((zone) => (
              <option key={zone.label} value={zone.value ?? 'local'}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>

        <div className="button-row aligned-buttons">
          <button type="button" className="secondary-button" onClick={setNow}>
            <RotateCcw size={17} aria-hidden="true" />
            Use now
          </button>
          <button type="button" className="primary-button" onClick={copySummary} disabled={!isValid}>
            <Clipboard size={17} aria-hidden="true" />
            Copy details
          </button>
        </div>
      </div>

      <div className="result-list" aria-live="polite">
        <div>
          <span>Unix seconds</span>
          <strong>{isValid ? Math.floor(date.getTime() / 1000) : 'Invalid'}</strong>
        </div>
        <div>
          <span>Unix milliseconds</span>
          <strong>{isValid ? date.getTime() : 'Invalid'}</strong>
        </div>
        <div>
          <span>ISO 8601</span>
          <strong>{isValid ? date.toISOString() : 'Invalid'}</strong>
        </div>
        <div>
          <span>Selected zone</span>
          <strong>{isValid ? formatDate(date, timeZone) : 'Invalid'}</strong>
        </div>
      </div>

      <p className="helper-text">{message || 'Accepts Unix seconds or milliseconds and converts instantly.'}</p>
    </div>
  )
}
