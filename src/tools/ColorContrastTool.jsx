import { useMemo, useState } from 'react'
import { Clipboard, Pipette, RotateCcw } from 'lucide-react'

const contrastTransferKey = 'everyday-tools:contrast-transfer'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function consumeContrastTransfer() {
  try {
    const parsed = JSON.parse(localStorage.getItem(contrastTransferKey) || '{}')
    localStorage.removeItem(contrastTransferKey)
    return {
      foreground: typeof parsed.foreground === 'string' ? parsed.foreground : '#1742a5',
      background: typeof parsed.background === 'string' ? parsed.background : '#ffffff',
    }
  } catch {
    return { foreground: '#1742a5', background: '#ffffff' }
  }
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const parsed = Number.parseInt(value, 16)
  if (Number.isNaN(parsed)) return { r: 0, g: 0, b: 0 }
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l: lightness }

  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  const hue =
    max === red
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4

  return { h: hue * 60, s: saturation, l: lightness }
}

function hslToRgb({ h, s, l }) {
  const hue = (((h % 360) + 360) % 360) / 360
  if (s === 0) {
    const value = l * 255
    return { r: value, g: value, b: value }
  }

  function hueToRgb(p, q, t) {
    let next = t
    if (next < 0) next += 1
    if (next > 1) next -= 1
    if (next < 1 / 6) return p + (q - p) * 6 * next
    if (next < 1 / 2) return q
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: hueToRgb(p, q, hue + 1 / 3) * 255,
    g: hueToRgb(p, q, hue) * 255,
    b: hueToRgb(p, q, hue - 1 / 3) * 255,
  }
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const values = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}

function contrastRatio(foreground, background) {
  const first = luminance(foreground)
  const second = luminance(background)
  const light = Math.max(first, second)
  const dark = Math.min(first, second)
  return (light + 0.05) / (dark + 0.05)
}

function getRating(ratio) {
  return {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
  }
}

function generatePalette(baseHex) {
  const hsl = rgbToHsl(hexToRgb(baseHex))
  return [
    { label: 'Darker', value: rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l - 0.24, 0, 1) })) },
    { label: 'Base', value: baseHex },
    { label: 'Lighter', value: rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l + 0.24, 0, 1) })) },
    { label: 'Analog A', value: rgbToHex(hslToRgb({ ...hsl, h: hsl.h - 28 })) },
    { label: 'Analog B', value: rgbToHex(hslToRgb({ ...hsl, h: hsl.h + 28 })) },
    { label: 'Complement', value: rgbToHex(hslToRgb({ ...hsl, h: hsl.h + 180 })) },
  ]
}

export function ColorContrastTool() {
  const [initialTransfer] = useState(() => consumeContrastTransfer())
  const [foreground, setForeground] = useState(initialTransfer.foreground)
  const [background, setBackground] = useState(initialTransfer.background)
  const [message, setMessage] = useState('')

  const ratio = useMemo(() => contrastRatio(foreground, background), [background, foreground])
  const rating = useMemo(() => getRating(ratio), [ratio])
  const palette = useMemo(() => generatePalette(foreground), [foreground])

  async function copyValue(value) {
    await navigator.clipboard.writeText(value)
    setMessage(`${value} copied`)
  }

  function resetColors() {
    setForeground('#1742a5')
    setBackground('#ffffff')
    setMessage('Reset colors')
  }

  return (
    <div className="tool-body color-tool">
      <section className="color-controls">
        <div className="color-picker-grid">
          <label>
            Foreground
            <span className="color-input-row">
              <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
              <input value={foreground} onChange={(event) => setForeground(event.target.value)} />
            </span>
          </label>
          <label>
            Background
            <span className="color-input-row">
              <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
              <input value={background} onChange={(event) => setBackground(event.target.value)} />
            </span>
          </label>
        </div>

        <div className="contrast-card" style={{ color: foreground, background }}>
          <p>Readable text sample</p>
          <strong>Contrast ratio {ratio.toFixed(2)}:1</strong>
        </div>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => copyValue(foreground)}>
            <Clipboard size={17} aria-hidden="true" />
            Copy foreground
          </button>
          <button type="button" className="secondary-button" onClick={() => copyValue(background)}>
            <Clipboard size={17} aria-hidden="true" />
            Copy background
          </button>
          <button type="button" className="secondary-button" onClick={resetColors}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
        <p className="helper-text">{message || 'Check color contrast locally.'}</p>
      </section>

      <section className="color-results">
        <div className="wcag-grid">
          {[
            ['Normal AA', rating.normalAA],
            ['Normal AAA', rating.normalAAA],
            ['Large AA', rating.largeAA],
            ['Large AAA', rating.largeAAA],
          ].map(([label, passes]) => (
            <div className={passes ? 'passes' : 'fails'} key={label}>
              <span>{label}</span>
              <strong>{passes ? 'Pass' : 'Fail'}</strong>
            </div>
          ))}
        </div>

        <div className="palette-grid" aria-label="Generated color palette">
          {palette.map((item) => (
            <button type="button" key={item.label} onClick={() => copyValue(item.value)} className="palette-swatch">
              <span style={{ background: item.value }}>
                <Pipette size={18} aria-hidden="true" />
              </span>
              <strong>{item.label}</strong>
              <code>{item.value}</code>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
