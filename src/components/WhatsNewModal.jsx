import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { PHASES } from '../data/changelog.js'
import { VERSION, RELEASE_DATE } from '../version.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso) {
  const parts = iso.split('-').map(Number)
  return `${MONTHS[parts[1] - 1]} ${parts[2]}, ${parts[0]}`
}

export function WhatsNewModal({ onClose }) {
  const [selectedPhase, setSelectedPhase] = useState(PHASES[0].phase)
  const backdropRef = useRef(null)

  const phase = PHASES.find(p => p.phase === selectedPhase) ?? PHASES[0]
  const allNew = phase.tools.every(t => t.change === 'New tool')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleBackdrop(e) {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    <div className="wn-backdrop" ref={backdropRef} onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="What's New">
      <div className="wn-modal">
        <div className="wn-header">
          <div>
            <h2 className="wn-title">What's New</h2>
            <p className="wn-subtitle">Everyday Tools {VERSION} · {RELEASE_DATE}</p>
          </div>
          <button type="button" className="icon-button wn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="wn-picker">
          <select
            className="wn-phase-select"
            value={selectedPhase}
            onChange={e => setSelectedPhase(Number(e.target.value))}
            aria-label="Select phase"
          >
            {PHASES.map(p => (
              <option key={p.phase} value={p.phase}>
                Phase {p.phase} — {p.title}  ({p.version})
              </option>
            ))}
          </select>
        </div>

        <div className="wn-detail">
          <div className="wn-detail-meta">
            <span className="wn-phase-badge">Phase {phase.phase}</span>
            <span className="wn-detail-version">{phase.version}</span>
            <span className="wn-detail-sep">·</span>
            <span className="wn-detail-date">{formatDate(phase.date)}</span>
            <span className="wn-detail-sep">·</span>
            <span className="wn-detail-count">{phase.tools.length} tools</span>
          </div>

          <p className="wn-detail-summary">{phase.summary}</p>

          {allNew ? (
            <div className="wn-tool-chips">
              {phase.tools.map(t => (
                <span key={t.name} className="wn-tool-chip">{t.name}</span>
              ))}
            </div>
          ) : (
            <ul className="wn-tool-list">
              {phase.tools.map(t => (
                <li key={t.name} className="wn-tool-item">
                  <div className="wn-tool-item-header">
                    <strong className="wn-tool-item-name">{t.name}</strong>
                    {t.change === 'New tool' && <span className="wn-tool-item-new">New</span>}
                  </div>
                  {t.change !== 'New tool' && (
                    <p className="wn-tool-item-change">{t.change}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
