import { useMemo, useState } from 'react'
import { Clipboard, RefreshCcw } from 'lucide-react'

const sets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/|~',
}

function randomIndex(max) {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % max
}

function shuffle(text) {
  return text
    .split('')
    .map((char) => ({ char, sort: randomIndex(1000000) }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.char)
    .join('')
}

function generatePassword(length, options) {
  const activeKeys = Object.keys(options).filter((key) => options[key])
  const pool = activeKeys.map((key) => sets[key]).join('')

  if (!pool) return ''

  const required = activeKeys.map((key) => sets[key][randomIndex(sets[key].length)])
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => {
    return pool[randomIndex(pool.length)]
  })

  return shuffle([...required, ...rest].join('')).slice(0, length)
}

function strengthLabel(length, selectedCount) {
  const score = Number(length >= 12) + Number(length >= 16) + Number(selectedCount >= 3) + Number(selectedCount === 4)
  if (score >= 4) return { label: 'Very strong', className: 'excellent' }
  if (score >= 3) return { label: 'Strong', className: 'good' }
  if (score >= 2) return { label: 'Fair', className: 'fair' }
  return { label: 'Weak', className: 'weak' }
}

export function PasswordGenerator() {
  const [length, setLength] = useState(18)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [password, setPassword] = useState(() => generatePassword(18, options))
  const [message, setMessage] = useState('')

  const selectedCount = Object.values(options).filter(Boolean).length
  const strength = useMemo(() => strengthLabel(length, selectedCount), [length, selectedCount])

  function updateOption(key) {
    const next = { ...options, [key]: !options[key] }
    if (!Object.values(next).some(Boolean)) return
    setOptions(next)
    setPassword(generatePassword(length, next))
    setMessage('')
  }

  function updateLength(nextLength) {
    const safeLength = Number(nextLength)
    setLength(safeLength)
    setPassword(generatePassword(safeLength, options))
    setMessage('')
  }

  async function copyPassword() {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setMessage('Password copied')
  }

  return (
    <div className="tool-body">
      <div className="password-output">
        <code>{password}</code>
        <button type="button" className="icon-button" onClick={copyPassword} aria-label="Copy password">
          <Clipboard size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="split-controls">
        <div className="control-stack">
          <label htmlFor="password-length">Length: {length}</label>
          <input
            id="password-length"
            type="range"
            min="8"
            max="48"
            value={length}
            onChange={(event) => updateLength(event.target.value)}
          />
          <div className={`strength-meter ${strength.className}`}>
            <span>{strength.label}</span>
            <span>{selectedCount} character sets</span>
          </div>
        </div>

        <div className="option-grid" aria-label="Password options">
          {Object.keys(sets).map((key) => (
            <label key={key} className="check-row">
              <input type="checkbox" checked={options[key]} onChange={() => updateOption(key)} />
              <span>{key}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => setPassword(generatePassword(length, options))}>
          <RefreshCcw size={17} aria-hidden="true" />
          Regenerate
        </button>
        <button type="button" className="primary-button" onClick={copyPassword}>
          <Clipboard size={17} aria-hidden="true" />
          Copy password
        </button>
      </div>
      <p className="helper-text">{message || 'Generated with the browser crypto API. Nothing leaves this page.'}</p>
    </div>
  )
}
