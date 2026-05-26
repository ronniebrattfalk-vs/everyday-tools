import { useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function gcd(a, b) {
  a = Math.round(a)
  b = Math.round(b)
  return b === 0 ? a : gcd(b, a % b)
}

function simplifyRatio(w, h) {
  if (!w || !h) return null
  const d = gcd(Math.round(w), Math.round(h))
  return { w: Math.round(w) / d, h: Math.round(h) / d }
}

const PRESETS = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '21:9', w: 21, h: 9 },
  { label: '3:2', w: 3, h: 2 },
  { label: '9:16', w: 9, h: 16 },
  { label: '4:5', w: 4, h: 5 },
  { label: '2:1', w: 2, h: 1 },
]

export function AspectRatioCalculator() {
  const [ratioW, setRatioW] = useState('16')
  const [ratioH, setRatioH] = useState('9')
  const [dimW, setDimW] = useState('1920')
  const [dimH, setDimH] = useState('')
  const [lastChanged, setLastChanged] = useState('w')
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const rw = parseFloat(ratioW) || 0
  const rh = parseFloat(ratioH) || 0
  const hasRatio = rw > 0 && rh > 0

  // Compute missing dimension
  let calcW = parseFloat(dimW) || 0
  let calcH = parseFloat(dimH) || 0

  if (hasRatio) {
    if (lastChanged === 'w' && calcW > 0) {
      calcH = (calcW / rw) * rh
    } else if (lastChanged === 'h' && calcH > 0) {
      calcW = (calcH / rh) * rw
    }
  }

  const simplified = hasRatio ? simplifyRatio(rw, rh) : null
  const displayW = calcW > 0 ? Math.round(calcW) : ''
  const displayH = calcH > 0 ? Math.round(calcH) : ''

  function applyPreset(p) {
    setRatioW(String(p.w))
    setRatioH(String(p.h))
    setDimW('1920')
    setDimH('')
    setLastChanged('w')
  }

  function handleDimW(val) {
    setDimW(val)
    setDimH('')
    setLastChanged('w')
  }

  function handleDimH(val) {
    setDimH(val)
    setDimW('')
    setLastChanged('h')
  }

  async function copy() {
    if (!displayW || !displayH) return
    await navigator.clipboard.writeText(`${displayW} × ${displayH}`)
    flash('Copied')
  }

  return (
    <div className="tool-body aspect-tool">
      <div className="aspect-left">
        <label className="field-label">
          Ratio (W : H)
          <div className="aspect-ratio-inputs">
            <input
              type="number"
              className="text-input"
              value={ratioW}
              min="1"
              step="1"
              onChange={(e) => setRatioW(e.target.value)}
              placeholder="W"
            />
            <span className="aspect-colon">:</span>
            <input
              type="number"
              className="text-input"
              value={ratioH}
              min="1"
              step="1"
              onChange={(e) => setRatioH(e.target.value)}
              placeholder="H"
            />
          </div>
        </label>

        <div className="aspect-presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="secondary-button"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="field-label">
          Dimensions — enter one, get the other
          <div className="aspect-dim-row">
            <label className="aspect-dim-label">
              Width (px)
              <input
                type="number"
                className="text-input"
                value={lastChanged === 'w' ? dimW : (displayW || '')}
                min="1"
                step="1"
                onChange={(e) => handleDimW(e.target.value)}
                placeholder="e.g. 1920"
              />
            </label>
            <span className="aspect-colon">×</span>
            <label className="aspect-dim-label">
              Height (px)
              <input
                type="number"
                className="text-input"
                value={lastChanged === 'h' ? dimH : (displayH || '')}
                min="1"
                step="1"
                onChange={(e) => handleDimH(e.target.value)}
                placeholder="e.g. 1080"
              />
            </label>
          </div>
        </div>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => { setRatioW('16'); setRatioH('9'); setDimW('1920'); setDimH(''); setLastChanged('w') }}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={copy} disabled={!displayW || !displayH}>
            <Clipboard size={16} aria-hidden="true" />
            Copy result
          </button>
        </div>
      </div>

      <div className="aspect-right">
        {displayW && displayH ? (
          <>
            <div className="aspect-result-card">
              <div className="aspect-result-big">{displayW} × {displayH}</div>
              <div className="helper-text" style={{ margin: '4px 0 0' }}>
                {simplified ? `${simplified.w}:${simplified.h} ratio` : ''}
              </div>
            </div>

            <div className="aspect-preview-wrap">
              <div
                className="aspect-preview-box"
                style={{
                  aspectRatio: `${rw} / ${rh}`,
                  maxWidth: '100%',
                  maxHeight: 200,
                }}
              />
            </div>

            <div className="aspect-info-table">
              <div className="aspect-info-row">
                <span>Width</span><span>{displayW} px</span>
              </div>
              <div className="aspect-info-row">
                <span>Height</span><span>{displayH} px</span>
              </div>
              <div className="aspect-info-row">
                <span>Ratio</span>
                <span>{rw}:{rh}{simplified && simplified.w !== rw ? ` (${simplified.w}:${simplified.h})` : ''}</span>
              </div>
              <div className="aspect-info-row">
                <span>Megapixels</span>
                <span>{((displayW * displayH) / 1_000_000).toFixed(2)} MP</span>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Enter a ratio and one dimension to calculate the other.</p>
          </div>
        )}
        <p className="helper-text">{message || ' '}</p>
      </div>
    </div>
  )
}
