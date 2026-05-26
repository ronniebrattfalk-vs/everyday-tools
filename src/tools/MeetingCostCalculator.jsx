import { useEffect, useRef, useState } from 'react'
import { Clipboard, Pause, Play, RotateCcw } from 'lucide-react'

const HEADCOUNT_PRESETS = [2, 5, 10, 15, 20]
const RATE_PRESETS = [50, 75, 100, 150, 200]
const DURATION_PRESETS = [
  { label: '15m', min: 15 },
  { label: '30m', min: 30 },
  { label: '45m', min: 45 },
  { label: '1h', min: 60 },
  { label: '90m', min: 90 },
  { label: '2h', min: 120 },
]

function usd(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n)
}

function fmtElapsed(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  parts.push(`${String(m).padStart(2, '0')}m`)
  parts.push(`${String(sec).padStart(2, '0')}s`)
  return parts.join(' ')
}

export function MeetingCostCalculator() {
  const [headcount, setHeadcount] = useState(5)
  const [rate, setRate] = useState(100)
  const [durationMin, setDurationMin] = useState(60)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [message, setMessage] = useState('')
  const intervalRef = useRef(null)

  const costPerSec = (headcount * rate) / 3600
  const plannedCost = costPerSec * durationMin * 60
  const liveCost = costPerSec * elapsed

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (running) intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  function reset() { setRunning(false); setElapsed(0) }
  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  async function copySummary() {
    const lines = [
      'Meeting Cost Summary',
      `Participants: ${headcount}`,
      `Rate: ${usd(rate)}/hr per person`,
      `Planned: ${durationMin} min → ${usd(plannedCost)}`,
      elapsed ? `Actual: ${fmtElapsed(elapsed)} → ${usd(liveCost)}` : null,
      `Cost/min: ${usd(costPerSec * 60)}`,
      `Per person: ${usd(rate * durationMin / 60)}`,
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(lines)
    flash('Copied')
  }

  const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 6 }

  return (
    <div className="tool-body meeting-tool">
      <div className="meeting-inputs">
        <div className="field-group">
          <label className="field-label">Participants</label>
          <div className="meeting-presets">
            {HEADCOUNT_PRESETS.map(n => (
              <button key={n} type="button" className={`chip-button${headcount === n ? ' active' : ''}`} onClick={() => setHeadcount(n)}>{n}</button>
            ))}
          </div>
          <input
            type="number"
            className="text-input"
            min={1}
            max={500}
            value={headcount}
            onChange={e => setHeadcount(Math.max(1, +e.target.value || 1))}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Average Hourly Rate ($/hr per person)</label>
          <div className="meeting-presets">
            {RATE_PRESETS.map(n => (
              <button key={n} type="button" className={`chip-button${rate === n ? ' active' : ''}`} onClick={() => setRate(n)}>${n}</button>
            ))}
          </div>
          <input
            type="number"
            className="text-input"
            min={0}
            value={rate}
            onChange={e => setRate(Math.max(0, +e.target.value || 0))}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Planned Duration (minutes)</label>
          <div className="meeting-presets">
            {DURATION_PRESETS.map(({ label, min }) => (
              <button key={min} type="button" className={`chip-button${durationMin === min ? ' active' : ''}`} onClick={() => setDurationMin(min)}>{label}</button>
            ))}
          </div>
          <input
            type="number"
            className="text-input"
            min={1}
            max={480}
            value={durationMin}
            onChange={e => setDurationMin(Math.max(1, +e.target.value || 1))}
          />
        </div>
      </div>

      <div className="meeting-results">
        <div className="meeting-cost-card">
          <div className="meeting-cost-label">Estimated Total Cost</div>
          <div className="meeting-cost-big">{usd(plannedCost)}</div>
          <div className="meeting-cost-meta">
            <span>{usd(costPerSec * 60)}<em>/min</em></span>
            <span>{usd(costPerSec)}<em>/sec</em></span>
          </div>
        </div>

        {elapsed > 0 && (
          <div className={`meeting-cost-card meeting-cost-card--live${liveCost > plannedCost ? ' over-budget' : ''}`}>
            <div className="meeting-cost-label">Live Meter</div>
            <div className="meeting-cost-big meeting-cost-live">{usd(liveCost)}</div>
            <div className="meeting-cost-meta">
              <span className="meeting-elapsed">{fmtElapsed(elapsed)} elapsed</span>
              {liveCost > plannedCost && <span className="meeting-over-tag">Over budget</span>}
            </div>
          </div>
        )}

        <div className="meeting-timer-row">
          <button type="button" className={running ? 'secondary-button' : 'primary-button'} onClick={() => setRunning(r => !r)}>
            {running
              ? <><Pause size={14} style={ICN} />Pause</>
              : <><Play size={14} style={ICN} />Start Timer</>
            }
          </button>
          {elapsed > 0 && (
            <button type="button" className="secondary-button" onClick={reset}>
              <RotateCcw size={14} style={ICN} />Reset
            </button>
          )}
          <button type="button" className="secondary-button" onClick={copySummary}>
            <Clipboard size={14} style={ICN} />Copy Summary
          </button>
        </div>

        <div className="meeting-breakdown">
          {[
            ['Cost per person', usd(rate * durationMin / 60)],
            ['If this runs daily (22 days)', usd(plannedCost * 22)],
            ['Workday value (8h × team)', usd(headcount * rate * 8)],
          ].map(([label, value]) => (
            <div key={label} className="meeting-breakdown-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <p className="helper-text">{message || 'Start the timer to watch the cost tick up in real time during the meeting.'}</p>
    </div>
  )
}
