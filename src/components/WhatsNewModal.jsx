import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { PHASES } from '../data/changelog.js'
import { VERSION, RELEASE_DATE } from '../version.js'

export function WhatsNewModal({ onClose }) {
  const [expanded, setExpanded] = useState(new Set([PHASES[0].phase]))
  const backdropRef = useRef(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggle(phase) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(phase) ? next.delete(phase) : next.add(phase)
      return next
    })
  }

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

        <div className="wn-body">
          {PHASES.map(p => {
            const open = expanded.has(p.phase)
            return (
              <div key={p.phase} className="wn-phase">
                <button
                  type="button"
                  className="wn-phase-header"
                  onClick={() => toggle(p.phase)}
                  aria-expanded={open}
                >
                  <div className="wn-phase-left">
                    <span className="wn-phase-badge">Phase {p.phase}</span>
                    <span className="wn-phase-title">{p.title}</span>
                    <span className="wn-phase-count">{p.tools.length} tool{p.tools.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="wn-phase-right">
                    <span className="wn-phase-version">{p.version}</span>
                    <span className="wn-phase-date">{p.date}</span>
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {open && (
                  <div className="wn-phase-body">
                    <p className="wn-phase-summary">{p.summary}</p>
                    <ul className="wn-tools-list">
                      {p.tools.map(t => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
