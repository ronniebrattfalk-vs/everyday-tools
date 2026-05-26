import { useEffect, useMemo, useState } from 'react'
import { Clipboard, Plus, X } from 'lucide-react'

const ALL_CITIES = [
  { city: 'Anchorage', country: 'USA', tz: 'America/Anchorage' },
  { city: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland' },
  { city: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok' },
  { city: 'Barcelona', country: 'Spain', tz: 'Europe/Madrid' },
  { city: 'Beijing', country: 'China', tz: 'Asia/Shanghai' },
  { city: 'Berlin', country: 'Germany', tz: 'Europe/Berlin' },
  { city: 'Brussels', country: 'Belgium', tz: 'Europe/Brussels' },
  { city: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires' },
  { city: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo' },
  { city: 'Cape Town', country: 'South Africa', tz: 'Africa/Johannesburg' },
  { city: 'Chicago', country: 'USA', tz: 'America/Chicago' },
  { city: 'Copenhagen', country: 'Denmark', tz: 'Europe/Copenhagen' },
  { city: 'Denver', country: 'USA', tz: 'America/Denver' },
  { city: 'Dhaka', country: 'Bangladesh', tz: 'Asia/Dhaka' },
  { city: 'Dubai', country: 'UAE', tz: 'Asia/Dubai' },
  { city: 'Dublin', country: 'Ireland', tz: 'Europe/Dublin' },
  { city: 'Helsinki', country: 'Finland', tz: 'Europe/Helsinki' },
  { city: 'Honolulu', country: 'USA', tz: 'Pacific/Honolulu' },
  { city: 'Hong Kong', country: 'China', tz: 'Asia/Hong_Kong' },
  { city: 'Istanbul', country: 'Turkey', tz: 'Europe/Istanbul' },
  { city: 'Jakarta', country: 'Indonesia', tz: 'Asia/Jakarta' },
  { city: 'Johannesburg', country: 'South Africa', tz: 'Africa/Johannesburg' },
  { city: 'Karachi', country: 'Pakistan', tz: 'Asia/Karachi' },
  { city: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos' },
  { city: 'Lima', country: 'Peru', tz: 'America/Lima' },
  { city: 'London', country: 'UK', tz: 'Europe/London' },
  { city: 'Los Angeles', country: 'USA', tz: 'America/Los_Angeles' },
  { city: 'Madrid', country: 'Spain', tz: 'Europe/Madrid' },
  { city: 'Melbourne', country: 'Australia', tz: 'Australia/Melbourne' },
  { city: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City' },
  { city: 'Miami', country: 'USA', tz: 'America/New_York' },
  { city: 'Milan', country: 'Italy', tz: 'Europe/Rome' },
  { city: 'Moscow', country: 'Russia', tz: 'Europe/Moscow' },
  { city: 'Mumbai', country: 'India', tz: 'Asia/Kolkata' },
  { city: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi' },
  { city: 'New York', country: 'USA', tz: 'America/New_York' },
  { city: 'Oslo', country: 'Norway', tz: 'Europe/Oslo' },
  { city: 'Paris', country: 'France', tz: 'Europe/Paris' },
  { city: 'Prague', country: 'Czech Republic', tz: 'Europe/Prague' },
  { city: 'Reykjavik', country: 'Iceland', tz: 'Atlantic/Reykjavik' },
  { city: 'Riyadh', country: 'Saudi Arabia', tz: 'Asia/Riyadh' },
  { city: 'Rome', country: 'Italy', tz: 'Europe/Rome' },
  { city: 'San Francisco', country: 'USA', tz: 'America/Los_Angeles' },
  { city: 'Santiago', country: 'Chile', tz: 'America/Santiago' },
  { city: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo' },
  { city: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul' },
  { city: 'Shanghai', country: 'China', tz: 'Asia/Shanghai' },
  { city: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore' },
  { city: 'Stockholm', country: 'Sweden', tz: 'Europe/Stockholm' },
  { city: 'Sydney', country: 'Australia', tz: 'Australia/Sydney' },
  { city: 'Taipei', country: 'Taiwan', tz: 'Asia/Taipei' },
  { city: 'Tehran', country: 'Iran', tz: 'Asia/Tehran' },
  { city: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo' },
  { city: 'Toronto', country: 'Canada', tz: 'America/Toronto' },
  { city: 'Vancouver', country: 'Canada', tz: 'America/Vancouver' },
  { city: 'Vienna', country: 'Austria', tz: 'Europe/Vienna' },
  { city: 'Warsaw', country: 'Poland', tz: 'Europe/Warsaw' },
  { city: 'Zurich', country: 'Switzerland', tz: 'Europe/Zurich' },
]

const DEFAULT_TZS = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']

function getOffset(tz, now) {
  try {
    const local = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const diff = Math.round((local - utc) / 60000)
    const h = Math.floor(Math.abs(diff) / 60)
    const m = Math.abs(diff) % 60
    const sign = diff >= 0 ? '+' : '−'
    return `UTC${sign}${String(h).padStart(2, '0')}${m ? ':' + String(m).padStart(2, '0') : ''}`
  } catch { return '' }
}

function formatClock(tz, now) {
  try {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now)
    const date = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
    }).format(now)
    const localDate = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    const userDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    let dayTag = ''
    if (localDate > userDate) dayTag = 'tomorrow'
    else if (localDate < userDate) dayTag = 'yesterday'
    return { time, date, dayTag, offset: getOffset(tz, now) }
  } catch { return { time: '--:--:--', date: '', dayTag: '', offset: '' } }
}

function initActiveTZs() {
  const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
  const list = localTZ && !DEFAULT_TZS.includes(localTZ)
    ? [localTZ, ...DEFAULT_TZS].slice(0, 6)
    : DEFAULT_TZS
  return [...new Set(list)]
}

export function WorldClock() {
  const [activeTZs, setActiveTZs] = useState(initActiveTZs)
  const [now, setNow] = useState(new Date())
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  function addCity(tz) {
    if (!activeTZs.includes(tz)) setActiveTZs(tzs => [...tzs, tz])
    setShowSearch(false)
    setSearch('')
  }

  function removeCity(tz) {
    setActiveTZs(tzs => tzs.filter(t => t !== tz))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ALL_CITIES.filter(c =>
      !activeTZs.includes(c.tz) &&
      (c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.tz.toLowerCase().includes(q))
    ).slice(0, 12)
  }, [search, activeTZs])

  const clocks = activeTZs.map(tz => {
    const city = ALL_CITIES.find(c => c.tz === tz)
    const clock = formatClock(tz, now)
    return { tz, label: city?.city ?? tz.split('/').pop().replace(/_/g, ' '), country: city?.country ?? '', ...clock }
  })

  async function copyMoment(c) {
    await navigator.clipboard.writeText(`${c.label}: ${c.time} (${c.date}) ${c.offset}`)
    flash('Copied')
  }

  return (
    <div className="tool-body world-clock-tool">
      <div className="world-clock-grid">
        {clocks.map(c => (
          <div key={c.tz} className="world-clock-card">
            <div className="world-clock-card-top">
              <div>
                <div className="world-clock-city">{c.label}</div>
                <div className="world-clock-country">{c.country}</div>
              </div>
              <div className="world-clock-actions">
                <button type="button" className="icon-button" onClick={() => copyMoment(c)} title="Copy time">
                  <Clipboard size={14} />
                </button>
                <button type="button" className="icon-button" onClick={() => removeCity(c.tz)} title="Remove">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="world-clock-time">{c.time}</div>
            <div className="world-clock-date">
              {c.date}
              {c.dayTag && <span className="world-clock-day-tag">{c.dayTag}</span>}
            </div>
            <div className="world-clock-offset">{c.offset}</div>
          </div>
        ))}

        <div className="world-clock-add-card">
          {!showSearch ? (
            <button type="button" className="world-clock-add-btn" onClick={() => setShowSearch(true)}>
              <Plus size={24} />
              <span>Add city</span>
            </button>
          ) : (
            <div className="world-clock-search">
              <input
                type="text"
                className="text-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities…"
                autoFocus
              />
              <div className="world-clock-dropdown">
                {filtered.map(c => (
                  <button
                    key={c.tz}
                    type="button"
                    className="world-clock-city-option"
                    onClick={() => addCity(c.tz)}
                  >
                    <span>{c.city}</span>
                    <span className="world-clock-country-label">{c.country}</span>
                  </button>
                ))}
                {!filtered.length && <p className="world-clock-no-results">No cities found.</p>}
              </div>
              <button type="button" className="secondary-button" onClick={() => { setShowSearch(false); setSearch('') }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="helper-text">{message || ' '}</p>
    </div>
  )
}
