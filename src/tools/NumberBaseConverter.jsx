import { useMemo, useState } from 'react'
import { Clipboard } from 'lucide-react'

const BASES = [
  { label: 'Binary', base: 2, prefix: '0b', placeholder: '1010' },
  { label: 'Octal', base: 8, prefix: '0o', placeholder: '17' },
  { label: 'Decimal', base: 10, prefix: '', placeholder: '255' },
  { label: 'Hex', base: 16, prefix: '0x', placeholder: 'FF' },
]

function groupNibbles(bin) {
  return bin.replace(/\B(?=(\d{4})+(?!\d))/g, ' ')
}

function stripPrefix(raw) {
  return raw.replace(/^(0x|0b|0o)/i, '').replace(/\s/g, '')
}

export function NumberBaseConverter() {
  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState(10)
  const [message, setMessage] = useState('')

  const result = useMemo(() => {
    const clean = stripPrefix(input.trim())
    if (!clean) return null
    const value = parseInt(clean, fromBase)
    if (isNaN(value) || value < 0) {
      return { error: `"${clean}" is not a valid ${BASES.find((b) => b.base === fromBase).label.toLowerCase()} number.` }
    }
    if (value > Number.MAX_SAFE_INTEGER) {
      return { error: 'Number is too large for safe integer conversion.' }
    }
    return {
      binary: value.toString(2),
      octal: value.toString(8),
      decimal: value.toString(10),
      hex: value.toString(16).toUpperCase(),
    }
  }, [input, fromBase])

  async function copy(text, label) {
    await navigator.clipboard.writeText(text)
    setMessage(`${label} copied`)
    setTimeout(() => setMessage(''), 1500)
  }

  const outputs = result && !result.error
    ? [
        { label: 'Binary', sublabel: 'base 2', value: result.binary, prefix: '0b', extra: groupNibbles(result.binary) },
        { label: 'Octal', sublabel: 'base 8', value: result.octal, prefix: '0o', extra: null },
        { label: 'Decimal', sublabel: 'base 10', value: result.decimal, prefix: '', extra: null },
        { label: 'Hexadecimal', sublabel: 'base 16', value: result.hex, prefix: '0x', extra: null },
      ]
    : []

  return (
    <div className="tool-body numbase-tool">
      <div className="numbase-input-panel">
        <div className="section-title-row">
          <h3>Input</h3>
        </div>

        <div className="category-tabs compact" aria-label="Input base">
          {BASES.map(({ label, base }) => (
            <button
              key={base}
              type="button"
              className={fromBase === base ? 'is-active' : ''}
              onClick={() => {
                setFromBase(base)
                setInput('')
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <label>
          {BASES.find((b) => b.base === fromBase).label} number
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={BASES.find((b) => b.base === fromBase).placeholder}
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        {result?.error && <p className="helper-text numbase-error">{result.error}</p>}

        <p className="helper-text">{message || 'Prefix is optional: 0b, 0o, 0x are stripped automatically.'}</p>
      </div>

      <div className="numbase-results">
        <h3>Conversions</h3>
        {outputs.length > 0 ? (
          <div className="numbase-result-list">
            {outputs.map(({ label, sublabel, value, prefix, extra }) => (
              <article key={label} className="numbase-result-card">
                <div>
                  <span>{label} — {sublabel}</span>
                  <strong>{prefix}{value}</strong>
                  {extra && extra !== value && (
                    <code className="numbase-bit-groups">{extra}</code>
                  )}
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => copy(prefix + value, label)}
                  aria-label={`Copy ${label} value`}
                >
                  <Clipboard size={16} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Enter a number on the left to see all base conversions.</p>
          </div>
        )}
      </div>
    </div>
  )
}
