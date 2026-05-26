import { useMemo, useState } from 'react'
import { Clipboard } from 'lucide-react'

// ── number-to-words ──────────────────────────────────────────────────────────
const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion']

function threeDigits(n) {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '')
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + threeDigits(n % 100) : '')
}

function intToWords(n) {
  if (n === 0) return 'zero'
  const neg = n < 0
  n = Math.abs(n)
  if (n > 999e12) return null
  const parts = []
  let si = 0
  while (n > 0) {
    const chunk = n % 1000
    if (chunk) parts.unshift(threeDigits(chunk) + (SCALES[si] ? ' ' + SCALES[si] : ''))
    n = Math.floor(n / 1000)
    si++
  }
  return (neg ? 'negative ' : '') + parts.join(', ')
}

function toWords(n) {
  if (!Number.isFinite(n)) return null
  if (Number.isInteger(n)) return intToWords(n)
  const [intStr, decStr] = String(Math.abs(n)).split('.')
  const intWords = intToWords(parseInt(intStr) * (n < 0 ? -1 : 1))
  const decWords = decStr ? ' point ' + [...decStr].map(d => ONES[+d] || 'zero').join(' ') : ''
  return intWords + decWords
}

// ── ordinal suffix ───────────────────────────────────────────────────────────
function ordinalSuffix(n) {
  const abs = Math.abs(Math.round(n))
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  switch (abs % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

// ── engineering notation ─────────────────────────────────────────────────────
function toEngineering(n) {
  if (n === 0) return '0'
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(n)
  const exp = Math.floor(Math.log10(abs))
  const engExp = Math.floor(exp / 3) * 3
  const mantissa = abs / 10 ** engExp
  const mStr = +mantissa.toPrecision(7)
  return `${sign}${mStr} × 10${superscript(engExp)}`
}

const SUP_DIGITS = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
function superscript(n) {
  return String(n).split('').map(c => SUP_DIGITS[c] ?? c).join('')
}

// ── Roman numerals ───────────────────────────────────────────────────────────
const ROMAN_MAP = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return null
  let r = ''
  for (const [v, s] of ROMAN_MAP) { while (n >= v) { r += s; n -= v } }
  return r
}

// ── fraction approximation (continued fractions) ────────────────────────────
function toFraction(x, maxDen = 1000) {
  if (Number.isInteger(x)) return `${x} / 1`
  const neg = x < 0
  x = Math.abs(x)
  const whole = Math.floor(x)
  let frac = x - whole
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1
  for (let i = 0; i < 64 && Math.abs(frac) > 1e-10; i++) {
    const a = Math.floor(frac <= 0 ? 1 / 1e-10 : 1 / frac)
    const h = a * h1 + h2
    const k = a * k1 + k2
    if (k > maxDen) break
    h2 = h1; h1 = h; k2 = k1; k1 = k
    frac = 1 / frac - a
  }
  const num = whole * k1 + h1
  return `${neg ? '−' : ''}${num} / ${k1}`
}

// ── format outputs ───────────────────────────────────────────────────────────
function buildFormats(n) {
  const rows = []

  rows.push({ label: 'Standard', value: n.toLocaleString('en-US', { maximumFractionDigits: 20 }) })
  rows.push({ label: 'Scientific', value: n.toExponential() })

  if (n !== 0) {
    rows.push({ label: 'Engineering', value: toEngineering(n) })
  }

  if (Number.isInteger(n)) {
    rows.push({ label: 'Ordinal', value: Math.round(n).toLocaleString('en-US') + ordinalSuffix(n) })
  }

  const words = toWords(n)
  if (words) rows.push({ label: 'Words', value: words })

  if (Number.isInteger(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER) {
    const abs = Math.abs(n)
    const sign = n < 0 ? '−' : ''
    const bin = abs.toString(2)
    const binGrouped = bin.replace(/.{4}(?=.)/g, '$& ')
    rows.push({ label: 'Binary', value: sign + binGrouped })
    rows.push({ label: 'Octal', value: sign + abs.toString(8) })
    rows.push({ label: 'Hexadecimal', value: sign + abs.toString(16).toUpperCase() })
  }

  const roman = Number.isInteger(n) ? toRoman(n) : null
  if (roman) rows.push({ label: 'Roman numerals', value: roman })

  if (!Number.isInteger(n)) {
    rows.push({ label: 'Fraction ≈', value: toFraction(n) })
  }

  rows.push({ label: 'Percentage', value: (n * 100).toLocaleString('en-US', { maximumFractionDigits: 10 }) + '%' })

  return rows
}

export function NumberFormatConverter() {
  const [input, setInput] = useState('1234567')
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const parsed = useMemo(() => {
    const n = Number(input.trim().replace(/,/g, ''))
    if (input.trim() === '' || isNaN(n)) return { error: 'Enter a valid number.' }
    return { n }
  }, [input])

  const rows = useMemo(() => {
    if (!parsed.n && parsed.n !== 0) return []
    return buildFormats(parsed.n)
  }, [parsed])

  async function copyRow(value) {
    await navigator.clipboard.writeText(value)
    flash('Copied')
  }

  return (
    <div className="tool-body numfmt-tool">
      <label className="field-label">
        Number
        <input
          type="text"
          className="text-input numfmt-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. 1234567.89"
          spellCheck={false}
        />
      </label>

      {parsed.error && input.trim() && (
        <p className="helper-text" style={{ color: 'var(--color-error, #b91c1c)' }}>{parsed.error}</p>
      )}

      {rows.length > 0 && (
        <div className="numfmt-rows">
          {rows.map(row => (
            <div key={row.label} className="numfmt-row">
              <span className="numfmt-label">{row.label}</span>
              <span className="numfmt-value">{row.value}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => copyRow(row.value)}
                title="Copy"
              >
                <Clipboard size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!rows.length && !parsed.error && (
        <div className="empty-state"><p>Enter a number above to see all formats.</p></div>
      )}

      <p className="helper-text">{message || ' '}</p>
    </div>
  )
}
