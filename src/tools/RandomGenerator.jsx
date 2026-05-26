import { useState } from 'react'
import { Clipboard, RefreshCw } from 'lucide-react'

function randInt(min, max) {
  const range = max - min + 1
  const buf = new Uint32Array(1)
  let n
  do {
    crypto.getRandomValues(buf)
    n = buf[0]
  } while (n >= Math.floor(0x100000000 / range) * range)
  return min + (n % range)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DICE = [4, 6, 8, 10, 12, 20, 100]
const MODES = ['Number', 'Dice', 'Coin', 'Shuffle', 'Pick']

export function RandomGenerator() {
  const [mode, setMode] = useState('Number')

  // Number state
  const [numMin, setNumMin] = useState('1')
  const [numMax, setNumMax] = useState('100')
  const [numCount, setNumCount] = useState('5')
  const [numUnique, setNumUnique] = useState(false)

  // Dice state
  const [diceSides, setDiceSides] = useState(6)
  const [diceCount, setDiceCount] = useState(2)

  // Coin state
  const [coinCount, setCoinCount] = useState(10)

  // List state (Shuffle & Pick share it)
  const [listText, setListText] = useState('Alice\nBob\nCarol\nDave\nEve\nFrank')
  const [pickCount, setPickCount] = useState('3')
  const [withReplacement, setWithReplacement] = useState(false)

  const [results, setResults] = useState(null)
  const [message, setMessage] = useState('')

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  function generate() {
    try {
      if (mode === 'Number') {
        const mn = parseInt(numMin) ?? 0
        const mx = parseInt(numMax) ?? 100
        const cnt = Math.min(1000, Math.max(1, parseInt(numCount) || 1))
        if (mn > mx) return setResults({ error: 'Min must be ≤ Max.' })
        if (numUnique && cnt > mx - mn + 1) return setResults({ error: 'Range too small for that many unique values.' })
        const nums = []
        const used = new Set()
        let guard = 0
        while (nums.length < cnt && guard++ < 1e6) {
          const n = randInt(mn, mx)
          if (!numUnique || !used.has(n)) { nums.push(n); used.add(n) }
        }
        setResults({ type: 'numbers', values: nums })
      } else if (mode === 'Dice') {
        const cnt = Math.min(100, Math.max(1, diceCount))
        const rolls = Array.from({ length: cnt }, () => randInt(1, diceSides))
        setResults({ type: 'dice', rolls, sides: diceSides, sum: rolls.reduce((s, n) => s + n, 0) })
      } else if (mode === 'Coin') {
        const cnt = Math.min(100, Math.max(1, coinCount))
        const flips = Array.from({ length: cnt }, () => (randInt(0, 1) ? 'H' : 'T'))
        const heads = flips.filter(f => f === 'H').length
        setResults({ type: 'coin', flips, heads, tails: cnt - heads })
      } else if (mode === 'Shuffle') {
        const items = listText.split('\n').map(s => s.trim()).filter(Boolean)
        if (!items.length) return setResults({ error: 'Add items to shuffle (one per line).' })
        setResults({ type: 'list', items: shuffle(items), label: 'Shuffled' })
      } else if (mode === 'Pick') {
        const items = listText.split('\n').map(s => s.trim()).filter(Boolean)
        const n = Math.max(1, parseInt(pickCount) || 1)
        if (!items.length) return setResults({ error: 'Add items to pick from (one per line).' })
        if (!withReplacement && n > items.length) return setResults({ error: `Can't pick ${n} unique items from ${items.length}.` })
        const picked = []
        const used = new Set()
        for (let i = 0; i < n; i++) {
          if (withReplacement) {
            picked.push(items[randInt(0, items.length - 1)])
          } else {
            let idx
            do { idx = randInt(0, items.length - 1) } while (used.has(idx))
            used.add(idx)
            picked.push(items[idx])
          }
        }
        setResults({ type: 'list', items: picked, label: 'Picked' })
      }
    } catch (e) {
      setResults({ error: e.message })
    }
  }

  async function copy() {
    if (!results || results.error) return
    let text = ''
    if (results.type === 'numbers') text = results.values.join(', ')
    else if (results.type === 'dice') text = `Rolls: ${results.rolls.join(', ')}\nSum: ${results.sum}`
    else if (results.type === 'coin') text = `${results.flips.join(' ')}\nHeads: ${results.heads}  Tails: ${results.tails}`
    else if (results.type === 'list') text = results.items.join('\n')
    await navigator.clipboard.writeText(text)
    flash('Copied')
  }

  const showList = mode === 'Shuffle' || mode === 'Pick'

  return (
    <div className="tool-body random-tool">
      <div className="random-left">
        <div className="category-tabs compact" style={{ flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => { setMode(m); setResults(null) }}>
              {m}
            </button>
          ))}
        </div>

        {mode === 'Number' && (
          <div className="random-controls">
            <div className="random-trio">
              <label className="field-label">
                Min
                <input type="number" className="text-input" value={numMin} onChange={e => setNumMin(e.target.value)} />
              </label>
              <label className="field-label">
                Max
                <input type="number" className="text-input" value={numMax} onChange={e => setNumMax(e.target.value)} />
              </label>
              <label className="field-label">
                Count
                <input type="number" className="text-input" value={numCount} min="1" max="1000" onChange={e => setNumCount(e.target.value)} />
              </label>
            </div>
            <label className="random-check">
              <input type="checkbox" checked={numUnique} onChange={e => setNumUnique(e.target.checked)} />
              No duplicates
            </label>
          </div>
        )}

        {mode === 'Dice' && (
          <div className="random-controls">
            <div className="field-label">
              Dice type
              <div className="random-dice-row">
                {DICE.map(d => (
                  <button key={d} type="button" className={`secondary-button${diceSides === d ? ' active' : ''}`} onClick={() => setDiceSides(d)}>
                    d{d}
                  </button>
                ))}
              </div>
            </div>
            <label className="field-label">
              Number of dice
              <input type="number" className="text-input" value={diceCount} min="1" max="100" onChange={e => setDiceCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} />
            </label>
          </div>
        )}

        {mode === 'Coin' && (
          <div className="random-controls">
            <label className="field-label">
              Number of flips
              <input type="number" className="text-input" value={coinCount} min="1" max="100" onChange={e => setCoinCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} />
            </label>
          </div>
        )}

        {showList && (
          <div className="random-controls">
            <label className="field-label">
              Items (one per line)
              <textarea className="random-textarea" value={listText} onChange={e => setListText(e.target.value)} placeholder="One item per line…" />
            </label>
            {mode === 'Pick' && (
              <>
                <label className="field-label">
                  How many to pick
                  <input type="number" className="text-input" value={pickCount} min="1" onChange={e => setPickCount(e.target.value)} />
                </label>
                <label className="random-check">
                  <input type="checkbox" checked={withReplacement} onChange={e => setWithReplacement(e.target.checked)} />
                  Allow duplicates (with replacement)
                </label>
              </>
            )}
          </div>
        )}

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={generate}>
            <RefreshCw size={16} aria-hidden="true" />
            Generate
          </button>
          <button type="button" className="secondary-button" onClick={copy} disabled={!results || !!results.error}>
            <Clipboard size={16} aria-hidden="true" />
            Copy
          </button>
        </div>
      </div>

      <div className="random-right">
        {results?.error && (
          <p className="helper-text" style={{ color: 'var(--color-error, #b91c1c)' }}>{results.error}</p>
        )}

        {results?.type === 'numbers' && (
          <>
            <p className="helper-text" style={{ margin: '0 0 8px' }}>{results.values.length} values</p>
            <div className="random-chip-grid">
              {results.values.map((n, i) => <span key={i} className="random-chip">{n}</span>)}
            </div>
          </>
        )}

        {results?.type === 'dice' && (
          <>
            <div className="random-die-grid">
              {results.rolls.map((r, i) => (
                <div key={i} className="random-die">
                  <span className="random-die-val">{r}</span>
                  <span className="random-die-label">d{results.sides}</span>
                </div>
              ))}
            </div>
            <p className="helper-text">
              Sum: <strong>{results.sum}</strong> · Avg: {(results.sum / results.rolls.length).toFixed(2)} · Max possible: {results.sides * results.rolls.length}
            </p>
          </>
        )}

        {results?.type === 'coin' && (
          <>
            <div className="random-coin-grid">
              {results.flips.map((f, i) => (
                <span key={i} className={`random-coin ${f === 'H' ? 'heads' : 'tails'}`}>{f}</span>
              ))}
            </div>
            <p className="helper-text">
              Heads: {results.heads} ({((results.heads / results.flips.length) * 100).toFixed(1)}%) · Tails: {results.tails}
            </p>
          </>
        )}

        {results?.type === 'list' && (
          <>
            <p className="helper-text" style={{ margin: '0 0 8px' }}>{results.label}: {results.items.length} items</p>
            <ol className="random-list">
              {results.items.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          </>
        )}

        {!results && <div className="empty-state"><p>Configure and press Generate.</p></div>}
        <p className="helper-text">{message || ' '}</p>
      </div>
    </div>
  )
}
