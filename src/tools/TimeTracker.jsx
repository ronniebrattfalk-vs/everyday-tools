import { useEffect, useMemo, useState } from 'react'
import { differenceInSeconds, format, parseISO } from 'date-fns'
import { Download, Edit2, Play, Square, Trash2, X } from 'lucide-react'
import Papa from 'papaparse'

const SESSIONS_KEY = 'everyday-tools-time-sessions'
const CURRENT_KEY  = 'everyday-tools-time-current'

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') } catch { return [] }
}
function loadCurrent() {
  try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null') } catch { return null }
}
function saveSessions(s) { try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)) } catch { /* ignore */ } }
function saveCurrent(c)  { try { c ? localStorage.setItem(CURRENT_KEY, JSON.stringify(c)) : localStorage.removeItem(CURRENT_KEY) } catch { /* ignore */ } }

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function fmtTime(iso) {
  return format(parseISO(iso), 'HH:mm')
}

function fmtDate(iso) {
  return format(parseISO(iso), 'MMM d')
}

function toIso(date, time) {
  return parseISO(`${date}T${time}:00`).toISOString()
}

export function TimeTracker() {
  const [sessions, setSessions] = useState(loadSessions)
  const [current,  setCurrent]  = useState(loadCurrent)
  const [project,  setProject]  = useState('')
  const [task,     setTask]     = useState('')
  const [now,      setNow]      = useState(() => new Date())

  const [showManual,   setShowManual]   = useState(false)
  const [manualDate,   setManualDate]   = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [manualStart,  setManualStart]  = useState('09:00')
  const [manualEnd,    setManualEnd]    = useState('10:00')
  const [manualProject,setManualProject]= useState('')
  const [manualTask,   setManualTask]   = useState('')
  const [manualError,  setManualError]  = useState('')

  const [editingId,    setEditingId]    = useState(null)
  const [editDraft,    setEditDraft]    = useState(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
    const session = { id: Date.now(), project: current.project, task: current.task, startIso: current.startIso, endIso: end.toISOString(), duration }
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
    if (editingId === id) setEditingId(null)
  }

  function clearAll() {
    if (!window.confirm('Delete all sessions?')) return
    setSessions([])
    saveSessions([])
  }

  // ── Manual entry ──────────────────────────────────────

  function addManual() {
    setManualError('')
    const proj = manualProject.trim() || 'Untitled'
    let startIso, endIso
    try {
      startIso = toIso(manualDate, manualStart)
      endIso   = toIso(manualDate, manualEnd)
    } catch {
      setManualError('Invalid date or time.')
      return
    }
    const duration = differenceInSeconds(parseISO(endIso), parseISO(startIso))
    if (duration <= 0) { setManualError('End time must be after start time.'); return }

    const session = { id: Date.now(), project: proj, task: manualTask.trim(), startIso, endIso, duration }
    const updated = [session, ...sessions].sort((a, b) => new Date(b.startIso) - new Date(a.startIso))
    setSessions(updated)
    saveSessions(updated)
    setManualProject('')
    setManualTask('')
    setShowManual(false)
  }

  // ── Inline session editing ────────────────────────────

  function startEdit(session) {
    setEditingId(session.id)
    setEditDraft({
      project:   session.project,
      task:      session.task,
      date:      format(parseISO(session.startIso), 'yyyy-MM-dd'),
      startTime: format(parseISO(session.startIso), 'HH:mm'),
      endTime:   format(parseISO(session.endIso),   'HH:mm'),
    })
  }

  function saveEdit(id) {
    if (!editDraft) return
    let startIso, endIso
    try {
      startIso = toIso(editDraft.date, editDraft.startTime)
      endIso   = toIso(editDraft.date, editDraft.endTime)
    } catch {
      return
    }
    const duration = differenceInSeconds(parseISO(endIso), parseISO(startIso))
    if (duration <= 0) return

    const updated = sessions.map(s =>
      s.id === id
        ? { ...s, project: editDraft.project || 'Untitled', task: editDraft.task, startIso, endIso, duration }
        : s
    )
    setSessions(updated)
    saveSessions(updated)
    setEditingId(null)
    setEditDraft(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft(null)
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
              <button type="button" className="primary-button tt-start-btn" onClick={start}>
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
                <button
                  type="button"
                  className={`secondary-button${showManual ? ' is-active' : ''}`}
                  onClick={() => setShowManual(v => !v)}
                >
                  + Manual entry
                </button>
                <button type="button" className="secondary-button" onClick={exportCsv}>
                  <Download size={13} style={ICN} />CSV
                </button>
                <button type="button" className="secondary-button" onClick={clearAll} style={{ color: 'var(--danger, #ef4444)' }}>
                  Clear All
                </button>
              </div>
            </div>

            {showManual && (
              <div className="tt-manual-form">
                <div className="tt-manual-row">
                  <div className="field-group">
                    <label className="field-label">Date</label>
                    <input type="date" className="text-input" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Start</label>
                    <input type="time" className="text-input" value={manualStart} onChange={e => setManualStart(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">End</label>
                    <input type="time" className="text-input" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Project</label>
                    <input
                      type="text"
                      className="text-input"
                      value={manualProject}
                      onChange={e => setManualProject(e.target.value)}
                      placeholder="Project"
                      list="tt-projects"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Task</label>
                    <input
                      type="text"
                      className="text-input"
                      value={manualTask}
                      onChange={e => setManualTask(e.target.value)}
                      placeholder="Task (optional)"
                    />
                  </div>
                </div>
                {manualError && <p className="tt-manual-error">{manualError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="primary-button" onClick={addManual}>Add Session</button>
                  <button type="button" className="secondary-button" onClick={() => { setShowManual(false); setManualError('') }}>Cancel</button>
                </div>
              </div>
            )}

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
                  {sessions.map(s => {
                    if (editingId === s.id && editDraft) {
                      return (
                        <tr key={s.id} className="tt-edit-row">
                          <td>
                            <input
                              className="text-input tt-edit-input"
                              value={editDraft.project}
                              onChange={e => setEditDraft(d => ({ ...d, project: e.target.value }))}
                              placeholder="Project"
                            />
                          </td>
                          <td>
                            <input
                              className="text-input tt-edit-input"
                              value={editDraft.task}
                              onChange={e => setEditDraft(d => ({ ...d, task: e.target.value }))}
                              placeholder="Task"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="text-input tt-edit-input"
                              value={editDraft.date}
                              onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))}
                            />
                          </td>
                          <td>
                            <div className="tt-edit-time">
                              <input
                                type="time"
                                className="text-input tt-edit-input"
                                value={editDraft.startTime}
                                onChange={e => setEditDraft(d => ({ ...d, startTime: e.target.value }))}
                              />
                              <span>–</span>
                              <input
                                type="time"
                                className="text-input tt-edit-input"
                                value={editDraft.endTime}
                                onChange={e => setEditDraft(d => ({ ...d, endTime: e.target.value }))}
                              />
                            </div>
                          </td>
                          <td className="tt-td-duration">
                            {(() => {
                              try {
                                const dur = differenceInSeconds(
                                  parseISO(toIso(editDraft.date, editDraft.endTime)),
                                  parseISO(toIso(editDraft.date, editDraft.startTime)),
                                )
                                return dur > 0 ? fmtDuration(dur) : '—'
                              } catch { return '—' }
                            })()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button type="button" className="secondary-button" style={{ padding: '2px 8px', fontSize: '0.78rem' }} onClick={() => saveEdit(s.id)}>Save</button>
                              <button type="button" className="icon-button" onClick={cancelEdit} title="Cancel"><X size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={s.id}>
                        <td className="tt-td-project">{s.project}</td>
                        <td className="tt-td-task">{s.task || <span className="tt-empty">—</span>}</td>
                        <td className="tt-td-meta">{fmtDate(s.startIso)}</td>
                        <td className="tt-td-meta">{fmtTime(s.startIso)}–{fmtTime(s.endIso)}</td>
                        <td className="tt-td-duration">{fmtDuration(s.duration)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button type="button" className="icon-button" onClick={() => startEdit(s)} title="Edit session">
                              <Edit2 size={13} />
                            </button>
                            <button type="button" className="icon-button" onClick={() => deleteSession(s.id)} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
        <>
          <p className="tt-empty-state">No sessions yet. Enter a project name and hit Start Tracking.</p>
          <button
            type="button"
            className={`secondary-button${showManual ? ' is-active' : ''}`}
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setShowManual(v => !v)}
          >
            + Add manual session
          </button>
          {showManual && (
            <div className="tt-manual-form">
              <div className="tt-manual-row">
                <div className="field-group">
                  <label className="field-label">Date</label>
                  <input type="date" className="text-input" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Start</label>
                  <input type="time" className="text-input" value={manualStart} onChange={e => setManualStart(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">End</label>
                  <input type="time" className="text-input" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Project</label>
                  <input type="text" className="text-input" value={manualProject} onChange={e => setManualProject(e.target.value)} placeholder="Project" />
                </div>
                <div className="field-group">
                  <label className="field-label">Task</label>
                  <input type="text" className="text-input" value={manualTask} onChange={e => setManualTask(e.target.value)} placeholder="Task (optional)" />
                </div>
              </div>
              {manualError && <p className="tt-manual-error">{manualError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="primary-button" onClick={addManual}>Add Session</button>
                <button type="button" className="secondary-button" onClick={() => { setShowManual(false); setManualError('') }}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="helper-text">Sessions persist across page reloads. Export to CSV for reports.</p>
    </div>
  )
}
