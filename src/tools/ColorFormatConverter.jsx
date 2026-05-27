import { useMemo, useState } from 'react'
import { Clipboard } from 'lucide-react'

const contrastTransferKey = 'everyday-tools:contrast-transfer'

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (full.length !== 6) return null
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b }
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
    case gn: h = ((bn - rn) / d + 2) / 6; break
    default: h = ((rn - gn) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h, s, l) {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function rgbToOklch({ r, g, b }) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const lr = lin(r / 255)
  const lg = lin(g / 255)
  const lb = lin(b / 255)
  const lms_l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const lms_m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const lms_s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * lms_l + 0.7936177850 * lms_m - 0.0040720468 * lms_s
  const A = 1.9779984951 * lms_l - 2.4285922050 * lms_m + 0.4505937099 * lms_s
  const B = 0.0259040371 * lms_l + 0.7827717662 * lms_m - 0.8086757660 * lms_s
  const C = Math.sqrt(A * A + B * B)
  const H = Math.atan2(B, A) * 180 / Math.PI
  return {
    l: Math.round(L * 1000) / 10,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H < 0 ? H + 360 : H),
  }
}

function parseInput(raw) {
  const str = raw.trim()
  if (!str) return null

  const hexMatch = str.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hexMatch) return hexToRgb('#' + hexMatch[1])

  const rgbMatch = str.match(/^rgba?\(\s*(\d+)[,\s]\s*(\d+)[,\s]\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10)
    const g = parseInt(rgbMatch[2], 10)
    const b = parseInt(rgbMatch[3], 10)
    if (r <= 255 && g <= 255 && b <= 255) return { r, g, b }
  }

  const hslMatch = str.match(/^hsla?\(\s*(\d+)[,\s]\s*(\d+)%?[,\s]\s*(\d+)%?/)
  if (hslMatch) return hslToRgb(parseInt(hslMatch[1], 10), parseInt(hslMatch[2], 10), parseInt(hslMatch[3], 10))

  return null
}

function sendToContrast(target, value) {
  const current = (() => {
    try {
      return JSON.parse(localStorage.getItem(contrastTransferKey) || '{}')
    } catch {
      return {}
    }
  })()
  localStorage.setItem(contrastTransferKey, JSON.stringify({ ...current, [target]: value }))
}

export function ColorFormatConverter() {
  const [input, setInput] = useState('#3b82f6')
  const [message, setMessage] = useState('')

  const rgb = useMemo(() => parseInput(input), [input])
  const hex = useMemo(() => (rgb ? rgbToHex(rgb) : '#000000'), [rgb])

  const formats = useMemo(() => {
    if (!rgb) return null
    const hsl = rgbToHsl(rgb)
    const oklch = rgbToOklch(rgb)
    const cssColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    return [
      { label: 'HEX', value: rgbToHex(rgb) },
      { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
      { label: 'OKLCH', value: `oklch(${oklch.l}% ${oklch.c} ${oklch.h})` },
      { label: 'CSS var', value: cssColor },
    ]
  }, [rgb])

  async function copy(value, label) {
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copied`)
    setTimeout(() => setMessage(''), 1500)
  }

  function queueContrastTransfer(target) {
    if (!rgb) return
    sendToContrast(target, rgbToHex(rgb))
    setMessage(`Color sent to Contrast Checker as ${target}`)
    setTimeout(() => setMessage(''), 1500)
  }

  const hasInput = input.trim().length > 0

  return (
    <div className="tool-body color-format-tool">
      <div className="color-format-controls">
        <div className="section-title-row">
          <h3>Input Color</h3>
        </div>

        <div className="color-format-input-row">
          <input
            type="color"
            className="color-format-picker"
            value={hex}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Color picker"
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#3b82f6  or  rgb(59, 130, 246)  or  hsl(217, 91%, 60%)"
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {hasInput && !rgb && (
          <p className="helper-text color-format-error">
            Could not parse. Try #rrggbb, #rgb, rgb(), or hsl().
          </p>
        )}

        {rgb && (
          <>
            <div
              className="color-format-preview"
              style={{ background: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
              aria-hidden="true"
            />
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={() => queueContrastTransfer('foreground')}>
                Send to contrast foreground
              </button>
              <button type="button" className="secondary-button" onClick={() => queueContrastTransfer('background')}>
                Send to contrast background
              </button>
            </div>
          </>
        )}

        <p className="helper-text">
          {message || 'Pick with the swatch or type any CSS color value. Alpha not included.'}
        </p>
      </div>

      <div className="color-format-results">
        <h3>All Formats</h3>

        {formats ? (
          <div className="color-format-list">
            {formats.map(({ label, value }) => (
              <article key={label} className="color-format-card">
                <div
                  className="color-format-swatch"
                  style={{ background: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                  aria-hidden="true"
                />
                <div className="color-format-info">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => copy(value, label)}
                  aria-label={`Copy ${label}`}
                >
                  <Clipboard size={16} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Color conversions appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
