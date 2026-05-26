import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

export function CSSGradientBuilder() {
  const [type, setType] = useState('linear')
  const [angle, setAngle] = useState(135)
  const [start, setStart] = useState('#2563eb')
  const [middle, setMiddle] = useState('#14b8a6')
  const [end, setEnd] = useState('#f59e0b')
  const [includeMiddle, setIncludeMiddle] = useState(true)
  const [message, setMessage] = useState('')

  const css = useMemo(() => {
    const stops = includeMiddle ? `${start} 0%, ${middle} 50%, ${end} 100%` : `${start} 0%, ${end} 100%`
    return type === 'linear' ? `linear-gradient(${angle}deg, ${stops})` : `radial-gradient(circle at center, ${stops})`
  }, [angle, end, includeMiddle, middle, start, type])

  async function copyCss() {
    await navigator.clipboard.writeText(`background: ${css};`)
    setMessage('Gradient CSS copied')
  }

  function resetTool() {
    setType('linear')
    setAngle(135)
    setStart('#2563eb')
    setMiddle('#14b8a6')
    setEnd('#f59e0b')
    setIncludeMiddle(true)
    setMessage('Reset gradient builder')
  }

  return (
    <div className="tool-body gradient-tool">
      <section className="gradient-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Design</p>
            <h3>CSS gradient builder</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Gradient type">
          <button type="button" className={type === 'linear' ? 'is-active' : ''} onClick={() => setType('linear')}>
            Linear
          </button>
          <button type="button" className={type === 'radial' ? 'is-active' : ''} onClick={() => setType('radial')}>
            Radial
          </button>
        </div>

        <label>
          Angle
          <input type="range" min="0" max="360" value={angle} onChange={(event) => setAngle(event.target.value)} disabled={type === 'radial'} />
        </label>

        <div className="color-picker-grid">
          <label>
            Start
            <div className="color-input-row">
              <input type="color" value={start} onChange={(event) => setStart(event.target.value)} />
              <input value={start} onChange={(event) => setStart(event.target.value)} />
            </div>
          </label>
          <label>
            Middle
            <div className="color-input-row">
              <input type="color" value={middle} onChange={(event) => setMiddle(event.target.value)} />
              <input value={middle} onChange={(event) => setMiddle(event.target.value)} />
            </div>
          </label>
          <label>
            End
            <div className="color-input-row">
              <input type="color" value={end} onChange={(event) => setEnd(event.target.value)} />
              <input value={end} onChange={(event) => setEnd(event.target.value)} />
            </div>
          </label>
        </div>

        <label className="check-row">
          <input type="checkbox" checked={includeMiddle} onChange={(event) => setIncludeMiddle(event.target.checked)} />
          Include middle stop
        </label>

        <button type="button" className="primary-button" onClick={copyCss}>
          <Clipboard size={17} aria-hidden="true" />
          Copy CSS
        </button>

        <p className="helper-text">{message || 'Build copyable CSS gradients locally.'}</p>
      </section>

      <section className="gradient-preview-panel">
        <div className="gradient-preview" style={{ background: css }} />
        <div className="url-result-card">
          <code>background: {css};</code>
          <button type="button" className="icon-button" onClick={copyCss} aria-label="Copy gradient CSS">
            <Clipboard size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
