import { useMemo, useState } from 'react'
import { Clipboard, RefreshCcw } from 'lucide-react'

const sets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/|~',
}

const passphraseWords = [
  'amber', 'anchor', 'apple', 'atlas', 'badge', 'bamboo', 'beacon', 'biscuit', 'blossom', 'bridge',
  'cactus', 'cannon', 'captain', 'cedar', 'comet', 'copper', 'crystal', 'dawn', 'delta', 'ember',
  'falcon', 'forest', 'fossil', 'galaxy', 'garden', 'glacier', 'harbor', 'hazel', 'horizon', 'island',
  'jasmine', 'jungle', 'lantern', 'legend', 'linen', 'marble', 'meadow', 'meteor', 'midnight', 'mist',
  'nebula', 'nickel', 'oasis', 'olive', 'onyx', 'orbit', 'panda', 'pebble', 'pine', 'prairie',
  'quartz', 'raven', 'reef', 'river', 'rocket', 'saffron', 'shadow', 'signal', 'silver', 'spruce',
  'summit', 'sunrise', 'thunder', 'timber', 'topaz', 'tulip', 'velvet', 'voyage', 'walnut', 'willow',
]

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
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pool[randomIndex(pool.length)])

  return shuffle([...required, ...rest].join('')).slice(0, length)
}

function generatePassphrase(wordCount, separator) {
  return Array.from({ length: wordCount }, () => passphraseWords[randomIndex(passphraseWords.length)]).join(separator)
}

function passwordStrengthLabel(length, options) {
  const poolSize =
    (options.uppercase ? 26 : 0) +
    (options.lowercase ? 26 : 0) +
    (options.numbers ? 10 : 0) +
    (options.symbols ? sets.symbols.length : 0)
  const entropy = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0
  if (entropy >= 80) return { label: 'Very strong', className: 'excellent', detail: `${entropy} bits entropy` }
  if (entropy >= 60) return { label: 'Strong', className: 'good', detail: `${entropy} bits entropy` }
  if (entropy >= 40) return { label: 'Fair', className: 'fair', detail: `${entropy} bits entropy` }
  return { label: 'Weak', className: 'weak', detail: `${entropy} bits entropy` }
}

function passphraseStrengthLabel(wordCount) {
  if (wordCount >= 6) return { label: 'Very strong', className: 'excellent', detail: `${wordCount} words` }
  if (wordCount >= 5) return { label: 'Strong', className: 'good', detail: `${wordCount} words` }
  if (wordCount >= 4) return { label: 'Fair', className: 'fair', detail: `${wordCount} words` }
  return { label: 'Weak', className: 'weak', detail: `${wordCount} words` }
}

export function PasswordGenerator() {
  const [mode, setMode] = useState('password')
  const [length, setLength] = useState(18)
  const [passphraseLength, setPassphraseLength] = useState(4)
  const [separator, setSeparator] = useState('-')
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [seed, setSeed] = useState(0)
  const [message, setMessage] = useState('')

  const output = useMemo(() => {
    void seed
    return mode === 'password'
      ? generatePassword(length, options)
      : generatePassphrase(passphraseLength, separator)
  }, [length, mode, options, passphraseLength, seed, separator])
  const strength = useMemo(() => {
    return mode === 'password'
      ? passwordStrengthLabel(length, options)
      : passphraseStrengthLabel(passphraseLength)
  }, [length, mode, options, passphraseLength])

  function updateOption(key) {
    const next = { ...options, [key]: !options[key] }
    if (!Object.values(next).some(Boolean)) return
    setOptions(next)
    setMessage('')
  }

  async function copyPassword() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setMessage(mode === 'password' ? 'Password copied' : 'Passphrase copied')
  }

  return (
    <div className="tool-body">
      <div className="category-tabs compact" aria-label="Password mode">
        <button type="button" className={mode === 'password' ? 'is-active' : ''} onClick={() => { setMode('password'); setMessage('') }}>
          Password
        </button>
        <button type="button" className={mode === 'passphrase' ? 'is-active' : ''} onClick={() => { setMode('passphrase'); setMessage('') }}>
          Passphrase
        </button>
      </div>

      <div className="password-output">
        <code>{output}</code>
        <button type="button" className="icon-button" onClick={copyPassword} aria-label={mode === 'password' ? 'Copy password' : 'Copy passphrase'}>
          <Clipboard size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="split-controls">
        <div className="control-stack">
          {mode === 'password' ? (
            <>
              <label htmlFor="password-length">Length: {length}</label>
              <input
                id="password-length"
                type="range"
                min="8"
                max="48"
                value={length}
                onChange={(event) => {
                  setLength(Number(event.target.value))
                  setMessage('')
                }}
              />
            </>
          ) : (
            <>
              <label htmlFor="passphrase-length">Words: {passphraseLength}</label>
              <input
                id="passphrase-length"
                type="range"
                min="3"
                max="8"
                value={passphraseLength}
                onChange={(event) => {
                  setPassphraseLength(Number(event.target.value))
                  setMessage('')
                }}
              />
            </>
          )}

          <div className={`strength-meter ${strength.className}`}>
            <span>{strength.label}</span>
            <span>{strength.detail}</span>
          </div>
        </div>

        {mode === 'password' ? (
          <div className="option-grid" aria-label="Password options">
            {Object.keys(sets).map((key) => (
              <label key={key} className="check-row">
                <input type="checkbox" checked={options[key]} onChange={() => updateOption(key)} />
                <span>{key}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="option-grid" aria-label="Passphrase options">
            <label className="control-stack">
              Separator
              <select value={separator} onChange={(event) => { setSeparator(event.target.value); setMessage('') }}>
                <option value="-">Hyphen</option>
                <option value="_">Underscore</option>
                <option value=".">Dot</option>
                <option value=" ">Space</option>
              </select>
            </label>
            <p className="helper-text">Diceware-style words make memorable secrets without sending anything off the page.</p>
          </div>
        )}
      </div>

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => setSeed((current) => current + 1)}>
          <RefreshCcw size={17} aria-hidden="true" />
          Regenerate
        </button>
        <button type="button" className="primary-button" onClick={copyPassword}>
          <Clipboard size={17} aria-hidden="true" />
          {mode === 'password' ? 'Copy password' : 'Copy passphrase'}
        </button>
      </div>
      <p className="helper-text">{message || 'Generated with the browser crypto API. Nothing leaves this page.'}</p>
    </div>
  )
}
