import { useEffect, useMemo, useState } from 'react'
import { Download, Play, Square, Trash2, X } from 'lucide-react'
import Papa from 'papaparse'

const SESSIONS_KEY = 'everyday-tools-time-sessions'
const CURRENT_KEY  = 'everyday-tools-time-current'

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') } catch { return [] }
}
function loadCurrent() {
  try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null') } catch { return null }
}
function saveSessions(s) { try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)) } catch {} }
function saveCurrent(c)  { try { c ? localStorage.setItem(CURRENT_KEY, JSON.stringify(c)) : localStorage.removeItem(CURRENT_KEY) } catch {} }

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TimeTracker() {
  const [sessions, setSessions] = useState(loadSessions)
  const [current,  setCurrent]  = useState(loadCurrent)
  const [project,  setProject]  = useState('')
  const [task,     setTask]     = useState('')
  const [now,      setNow]      = useState(() => new Date())
  const [message,  setMessage]  = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  const elapsed = current ? Math.floor((now - new Date(current.startIso)) / 1000) : 0

  function start() {
    const proj = project.trim() || 'Untitled'
    const c = { project: proj, task: task.trim(), startIso: new Date().toISOString() }
    setCurrent(c)
    saveCurrent(c)
  }

  function stop() {
    if (!current) return
    const end = new Date()
    const duration = Math.max(1, Math.floor((end - new Date(current.startIso)) / 1000))
    const session = {
      id: Date.now(),
      project: current.project,
      task: current.task,
      startIso: current.startIso,
      endIso: end.toISOString(),
      duration,
    }
    const updated = [session, ...sessions]
    setSessions(updated)
    saveSessions(updated)
    setCurrent(null)
    saveCurrent(null)
  }

  function discard() {
    setCurrent(null)
    saveCurrent(null)
  }

  function deleteSession(id) {
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    saveSessions(updated)
  }

  function clearAll() {
    if (!window.confirm('Delete all sessions?')) return
    setSessions([])
    saveSessions([])
  }

  const projectTotals = useMemo(() => {
    const map = {}
    sessions.forEach(s => { map[s.project] = (map[s.project] ?? 0) + s.duration })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [sessions])

  const recentProjects = useMemo(() =>
    [...new Set(sessions.map(s => s.project))].slice(0, 5),
    [sessions]
  )

  function exportCsv() {
    const rows = sessions.map(s => ({
      Project:        s.project,
      Task:           s.task,
      Date:           s.startIso.slice(0, 10),
      Start:          fmtTime(s.startIso),
      End:            fmtTime(s.endIso),
      'Duration (s)': s.duration,
      'Duration (h)': (s.duration / 3600).toFixed(4),
    }))
    const blob = new Blob([Papa.unparse(rows)], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: 'time-tracker.csv',
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 5 }

  return (
    <div className="tool-body time-tracker-tool">
      <div className="tt-timer-section">
        <div className="tt-inputs">
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Project</label>
            <input
              type="text"
              className="text-input"
              value={project}
              onChange={e => setProject(e.target.value)}
              placeholder="Project name"
              list="tt-projects"
              disabled={!!current}
            />
            {recentProjects.length > 0 && (
              <datalist id="tt-projects">
                {recentProjects.map(p => <option key={p} value={p} />)}
              </datalist>
            )}
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Task (optional)</label>
            <input
              type="text"
              className="text-input"
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder="What are you working on?"
              disabled={!!current}
            />
          </div>
        </div>

        <div className="tt-clock-panel">
          {current ? (
            <>
              <div className="tt-running-label">
                <span className="tt-running-dot" />
                {current.project}{current.task ? ` · ${current.task}` : ''}
              </div>
              <div className="tt-elapsed">{fmtDuration(elapsed)}</div>
              <div className="tt-timer-actions">
                <button type="button" className="primary-button tt-stop-btn" onClick={stop}>
                  <Square size={14} style={ICN} />Stop & Save
                </button>
                <button type="button" className="secondary-button" onClick={discard} title="Discard session">
                  <X size={14} style={ICN} />Discard
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="tt-elapsed tt-elapsed--idle">00:00</div>
              <button
                type="button"
                className="primary-button tt-start-btn"
                onClick={start}
              >
                <Play size={16} style={ICN} />Start Tracking
              </button>
            </>
          )}
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="tt-body">
          <div className="tt-sessions-panel">
            <div className="section-title-row">
              <span className="section-title">Sessions</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="secondary-button" onClick={exportCsv}>
                  <Download size={13} style={ICN} />CSV
                </button>
                <button type="button" className="secondary-button" onClick={clearAll} style={{ color: 'var(--danger, #ef4444)' }}>
                  Clear All
                </button>
              </div>
            </div>
            <div className="tt-sessions-table-wrap">
              <table className="tt-sessions-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td className="tt-td-project">{s.project}</td>
                      <td className="tt-td-task">{s.task || <span className="tt-empty">—</span>}</td>
                      <td className="tt-td-meta">{fmtDate(s.startIso)}</td>
                      <td className="tt-td-meta">{fmtTime(s.startIso)}–{fmtTime(s.endIso)}</td>
                      <td className="tt-td-duration">{fmtDuration(s.duration)}</td>
                      <td>
                        <button type="button" className="icon-button" onClick={() => deleteSession(s.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tt-totals-panel">
            <div className="section-title">By Project</div>
            <div className="tt-totals-list">
              {projectTotals.map(([proj, dur]) => {
                const totalAll = projectTotals.reduce((s, [, d]) => s + d, 0)
                return (
                  <div key={proj} className="tt-total-row">
                    <div className="tt-total-info">
                      <span className="tt-total-project">{proj}</span>
                      <span className="tt-total-duration">{fmtDuration(dur)}</span>
                    </div>
                    <div className="tt-total-bar-wrap">
                      <div className="tt-total-bar" style={{ width: `${(dur / totalAll) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="tt-grand-total">
              <span>Total</span>
              <strong>{fmtDuration(sessions.reduce((s, se) => s + se.duration, 0))}</strong>
            </div>
          </div>
        </div>
      )}

      {!current && sessions.length === 0 && (
        <p className="tt-empty-state">No sessions yet. Enter a project name and hit Start Tracking.</p>
      )}

      <p className="helper-text">
        {message || 'Sessions persist across page reloads. Export to CSV for reports.'}
      </p>
    </div>
  )
}
