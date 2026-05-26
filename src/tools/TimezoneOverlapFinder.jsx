import { useMemo, useState } from 'react'
import { Clipboard, Plus, X } from 'lucide-react'

const ALL_CITIES = [
  { city: 'Anchorage', country: 'USA', tz: 'America/Anchorage' },
  { city: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland' },
  { city: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok' },
  { city: 'Beijing', country: 'China', tz: 'Asia/Shanghai' },
  { city: 'Berlin', country: 'Germany', tz: 'Europe/Berlin' },
  { city: 'Brussels', country: 'Belgium', tz: 'Europe/Brussels' },
  { city: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires' },
  { city: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo' },
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

const ZONE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function getOffsetMinutes(tz) {
  try {
    const now = new Date()
    const local = new Date(now.toLocaleString('en-US', { timeZone: tz }))
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    return Math.round((local - utc) / 60000)
  } catch { return 0 }
}

function formatOffsetStr(offsetMin) {
  const h = Math.floor(Math.abs(offsetMin) / 60)
  const m = Math.abs(offsetMin) % 60
  const sign = offsetMin >= 0 ? '+' : '−'
  return `UTC${sign}${String(h).padStart(2, '0')}${m ? ':' + String(m).padStart(2, '0') : ''}`
}

function localHourAt(utcHour, offsetMin) {
  return (((utcHour * 60 + offsetMin) % 1440) + 1440) % 1440 / 60
}

function isWorking(utcHour, offsetMin, start, end) {
  const lh = Math.floor(localHourAt(utcHour, offsetMin))
  if (start <= end) return lh >= start && lh <= end
  return lh >= start || lh <= end
}

function fmtHour(h) {
  const totalMin = Math.round(h * 60) % 1440
  const hrs = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function initZones() {
  const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
  const defaults = ['America/New_York', 'Europe/London', 'Asia/Tokyo']
  const tzList = localTZ && !defaults.includes(localTZ)
    ? [localTZ, ...defaults].slice(0, 3)
    : defaults
  return [...new Set(tzList)].map(tz => {
    const city = ALL_CITIES.find(c => c.tz === tz)
    return { tz, label: city?.city ?? tz.split('/').pop().replace(/_/g, ' '), start: 9, end: 17 }
  })
}

export function TimezoneOverlapFinder() {
  const [zones, setZones] = useState(initZones)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [message, setMessage] = useState('')

  const currentUTCHour = new Date().getUTCHours()

  const zoneData = useMemo(() => zones.map(z => ({
    ...z,
    offsetMin: getOffsetMinutes(z.tz),
    offsetStr: formatOffsetStr(getOffsetMinutes(z.tz)),
  })), [zones])

  const overlapHours = useMemo(() =>
    Array.from({ length: 24 }, (_, h) =>
      zoneData.length > 0 && zoneData.every(z => isWorking(h, z.offsetMin, z.start, z.end))
    ),
    [zoneData]
  )

  const overlapRanges = useMemo(() => {
    const ranges = []
    let start = null
    for (let h = 0; h <= 24; h++) {
      if (h < 24 && overlapHours[h] && start === null) start = h
      if ((h === 24 || !overlapHours[h]) && start !== null) { ranges.push([start, h]); start = null }
    }
    return ranges
  }, [overlapHours])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }
  function updateZone(idx, key, val) { setZones(zs => zs.map((z, i) => i === idx ? { ...z, [key]: val } : z)) }
  function removeZone(idx) { setZones(zs => zs.filter((_, i) => i !== idx)) }

  function addCity(tz) {
    const city = ALL_CITIES.find(c => c.tz === tz)
    setZones(zs => [...zs, { tz, label: city?.city ?? tz.split('/').pop().replace(/_/g, ' '), start: 9, end: 17 }])
    setShowSearch(false)
    setSearch('')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ALL_CITIES.filter(c =>
      !zones.some(z => z.tz === c.tz) &&
      (c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.tz.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [search, zones])

  async function copyOverlap() {
    if (!overlapRanges.length) { flash('No overlap'); return }
    const lines = overlapRanges.map(([s, e]) => {
      const utcStr = `${String(s).padStart(2, '0')}:00–${String(e).padStart(2, '00')}:00 UTC`
      const perZone = zoneData.map(z => {
        const ls = Math.floor(localHourAt(s, z.offsetMin))
        const le = Math.floor(localHourAt(e % 24, z.offsetMin))
        return `${z.label} ${String(ls).padStart(2, '0')}:00–${String(le).padStart(2, '0')}:00`
      }).join(' · ')
      return `${utcStr} (${perZone})`
    })
    await navigator.clipboard.writeText(lines.join('\n'))
    flash('Copied')
  }

  return (
    <div className="tool-body tz-overlap-tool">
      <div className="tz-overlap-config">
        {zoneData.map((z, i) => (
          <div key={z.tz} className="tz-overlap-zone-row">
            <span className="tz-overlap-zone-dot" style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }} />
            <div className="tz-overlap-zone-info">
              <span className="tz-overlap-zone-name">{z.label}</span>
              <span className="tz-overlap-zone-offset">{z.offsetStr}</span>
            </div>
            <div className="tz-overlap-hours">
              <select className="select-input tz-overlap-select" value={z.start} onChange={e => updateZone(i, 'start', +e.target.value)}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <span className="tz-overlap-to">–</span>
              <select className="select-input tz-overlap-select" value={z.end} onChange={e => updateZone(i, 'end', +e.target.value)}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <button type="button" className="icon-button" onClick={() => removeZone(i)} title="Remove"><X size={14} /></button>
          </div>
        ))}

        {zones.length < 6 && (
          <div className="tz-overlap-add">
            {!showSearch ? (
              <button type="button" className="secondary-button" onClick={() => setShowSearch(true)}>
                <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Add timezone
              </button>
            ) : (
              <div className="tz-overlap-search-wrap">
                <input
                  type="text"
                  className="text-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search cities…"
                  autoFocus
                />
                <div className="tz-overlap-dropdown">
                  {filtered.map(c => (
                    <button key={c.tz} type="button" className="world-clock-city-option" onClick={() => addCity(c.tz)}>
                      <span>{c.city}</span>
                      <span className="world-clock-country-label">{c.country}</span>
                    </button>
                  ))}
                  {!filtered.length && <p className="world-clock-no-results">No cities found.</p>}
                </div>
                <button type="button" className="secondary-button" onClick={() => { setShowSearch(false); setSearch('') }}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="tz-overlap-table-wrap">
        <table className="tz-overlap-table">
          <thead>
            <tr>
              <th className="tz-overlap-th-label" />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className={`tz-overlap-th-hour${h === currentUTCHour ? ' tz-overlap-current-col' : ''}`}>
                  {String(h).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zoneData.map((z, i) => (
              <tr key={z.tz}>
                <td className="tz-overlap-td-label">
                  <div className="tz-overlap-td-inner">
                    <span className="tz-overlap-zone-dot" style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                    <span>{z.label}</span>
                  </div>
                </td>
                {Array.from({ length: 24 }, (_, h) => {
                  const lh = localHourAt(h, z.offsetMin)
                  const working = isWorking(h, z.offsetMin, z.start, z.end)
                  return (
                    <td
                      key={h}
                      className={`tz-overlap-cell${working ? ' working' : ''}${h === currentUTCHour ? ' tz-overlap-current-col' : ''}`}
                      style={working ? { backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] + '33' } : undefined}
                      title={`${z.label}: ${fmtHour(lh)} local`}
                    >
                      {String(Math.floor(lh % 24)).padStart(2, '0')}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="tz-overlap-overlap-row">
              <td className="tz-overlap-td-label tz-overlap-td-overlap">
                <div className="tz-overlap-td-inner">Overlap</div>
              </td>
              {Array.from({ length: 24 }, (_, h) => (
                <td
                  key={h}
                  className={`tz-overlap-cell tz-overlap-overlap-cell${overlapHours[h] ? ' overlap' : ''}${h === currentUTCHour ? ' tz-overlap-current-col' : ''}`}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tz-overlap-summary">
        {overlapRanges.length > 0 ? (
          <>
            <span className="tz-overlap-summary-label">Shared windows (UTC):</span>
            <div className="tz-overlap-badges">
              {overlapRanges.map(([s, e], i) => (
                <span key={i} className="tz-overlap-badge">
                  {String(s).padStart(2, '0')}:00–{String(e).padStart(2, '0')}:00
                </span>
              ))}
            </div>
            <button type="button" className="icon-button" onClick={copyOverlap} title="Copy overlap times">
              <Clipboard size={14} />
            </button>
          </>
        ) : (
          <span className="tz-overlap-no-overlap">No shared working hours with current settings.</span>
        )}
      </div>

      <p className="helper-text">{message || 'Colored cells = working hours. Bottom row shows when all zones overlap.'}</p>
    </div>
  )
}
