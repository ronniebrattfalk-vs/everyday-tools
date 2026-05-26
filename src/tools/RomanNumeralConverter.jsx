import { useState } from 'react'
import { ArrowLeftRight, Clipboard } from 'lucide-react'

const NUMERALS = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'],  [90, 'XC'],  [50, 'L'],  [40, 'XL'],
  [10, 'X'],   [9, 'IX'],   [5, 'V'],   [4, 'IV'],
  [1, 'I'],
]

function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return null
  let result = ''
  for (const [val, sym] of NUMERALS) {
    while (n >= val) {
      result += sym
      n -= val
    }
  }
  return result
}

function fromRoman(s) {
  const str = s.toUpperCase().trim()
  if (!str) return null
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let result = 0
  for (let i = 0; i < str.length; i++) {
    const cur = map[str[i]]
    const next = map[str[i + 1]]
    if (cur === undefined) return null
    if (next && cur < next) {
      result -= cur
    } else {
      result += cur
    }
  }
  // Validate by round-tripping
  if (result < 1 || result > 3999) return null
  if (toRoman(result) !== str) return null
  return result
}

const EXAMPLES = [1, 4, 9, 14, 40, 90, 399, 1000, 1999, 2024, 3999]

export function RomanNumeralConverter() {
  const [mode, setMode] = useState('to-roman')
  const [input, setInput] = useState('2024')
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  function toggle() {
    const next = mode === 'to-roman' ? 'from-roman' : 'to-roman'
    setMode(next)
    setInput(next === 'to-roman' ? '2024' : 'MMXXIV')
  }

  const output =
    mode === 'to-roman'
      ? toRoman(parseInt(input, 10))
      : fromRoman(input)

  const outputStr = output !== null ? String(output) : null

  async function copy() {
    if (outputStr === null) return
    await navigator.clipboard.writeText(outputStr)
    flash('Copied')
  }

  return (
    <div className="tool-body roman-tool">
      <div className="roman-header">
        <div className="category-tabs compact">
          <button className={mode === 'to-roman' ? 'active' : ''} onClick={() => { setMode('to-roman'); setInput('2024') }}>
            Number → Roman
          </button>
          <button className={mode === 'from-roman' ? 'active' : ''} onClick={() => { setMode('from-roman'); setInput('MMXXIV') }}>
            Roman → Number
          </button>
        </div>
        <button type="button" className="secondary-button" onClick={toggle}>
          <ArrowLeftRight size={16} aria-hidden="true" />
          Swap
        </button>
      </div>

      <div className="roman-body">
        <label className="field-label">
          {mode === 'to-roman' ? 'Integer (1–3999)' : 'Roman numeral'}
          <input
            type={mode === 'to-roman' ? 'number' : 'text'}
            className="text-input roman-input"
            value={input}
            min={mode === 'to-roman' ? 1 : undefined}
            max={mode === 'to-roman' ? 3999 : undefined}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={mode === 'to-roman' ? '1–3999' : 'e.g. XIV'}
          />
        </label>

        <div className="roman-result-wrap">
          {outputStr !== null ? (
            <div className="roman-result">
              <span className="roman-result-value">{outputStr}</span>
              <button type="button" className="secondary-button" onClick={copy}>
                <Clipboard size={16} aria-hidden="true" />
                Copy
              </button>
            </div>
          ) : input.trim() ? (
            <p className="helper-text" style={{ color: 'var(--color-error, #b91c1c)' }}>
              {mode === 'to-roman'
                ? 'Enter an integer between 1 and 3999.'
                : 'Invalid Roman numeral. Use I, V, X, L, C, D, M with standard subtractive notation.'}
            </p>
          ) : null}
        </div>

        <p className="helper-text">{message || ' '}</p>
      </div>

      <div className="roman-examples">
        <span className="section-title" style={{ fontSize: '0.82rem' }}>Quick examples</span>
        <div className="roman-example-grid">
          {EXAMPLES.map((n) => (
            <button
              key={n}
              type="button"
              className="roman-example-btn"
              onClick={() => {
                if (mode === 'to-roman') {
                  setInput(String(n))
                } else {
                  setInput(toRoman(n) ?? '')
                }
              }}
            >
              <span>{n}</span>
              <span className="roman-example-sym">{toRoman(n)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
