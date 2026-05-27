import { useCallback, useMemo, useRef, useState } from 'react'
import { Clipboard, Delete } from 'lucide-react'

// ── Tokenizer ────────────────────────────────────────────────────────────────
function tokenize(raw) {
  const s = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  const tokens = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (/\s/.test(ch)) { i++; continue }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      if ((s[j] === 'e' || s[j] === 'E') && /[0-9+-]/.test(s[j + 1] ?? '')) {
        j++
        if (s[j] === '+' || s[j] === '-') j++
        while (j < s.length && /[0-9]/.test(s[j])) j++
      }
      tokens.push({ t: 'N', v: parseFloat(s.slice(i, j)) })
      i = j; continue
    }
    if (/[a-zA-Zπ]/.test(ch)) {
      let j = i + 1
      while (j < s.length && /[a-zA-Z0-9_π]/.test(s[j])) j++
      tokens.push({ t: 'I', v: s.slice(i, j) })
      i = j; continue
    }
    if (ch === '(') { tokens.push({ t: 'LP' }); i++; continue }
    if (ch === ')') { tokens.push({ t: 'RP' }); i++; continue }
    if (ch === ',') { tokens.push({ t: 'CM' }); i++; continue }
    if ('+-*/^!%'.includes(ch)) { tokens.push({ t: 'OP', v: ch }); i++; continue }
    throw new Error(`Unknown character: ${ch}`)
  }
  return tokens
}

// ── Expression evaluator (recursive descent) ────────────────────────────────
function factorial(n) {
  n = Math.round(n)
  if (n < 0) throw new Error('Factorial undefined for negatives')
  if (n > 170) throw new Error('Factorial too large (> 170!)')
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function evaluate(expr, angleMode = 'deg', ans = 0) {
  const tokens = tokenize(expr.trim())
  if (!tokens.length) throw new Error('Empty expression')
  let pos = 0

  const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2, ans, inf: Infinity }
  const toR = angleMode === 'deg' ? x => x * Math.PI / 180 : x => x
  const frR = angleMode === 'deg' ? x => x * 180 / Math.PI : x => x

  function fn(name, a) {
    switch (name.toLowerCase()) {
      case 'sin':   return Math.sin(toR(a[0]))
      case 'cos':   return Math.cos(toR(a[0]))
      case 'tan':   return Math.tan(toR(a[0]))
      case 'asin': case 'arcsin': return frR(Math.asin(a[0]))
      case 'acos': case 'arccos': return frR(Math.acos(a[0]))
      case 'atan': case 'arctan': return frR(Math.atan(a[0]))
      case 'atan2': return frR(Math.atan2(a[0], a[1]))
      case 'sinh':  return Math.sinh(a[0])
      case 'cosh':  return Math.cosh(a[0])
      case 'tanh':  return Math.tanh(a[0])
      case 'log': case 'log10': return Math.log10(a[0])
      case 'log2':  return Math.log2(a[0])
      case 'ln':    return Math.log(a[0])
      case 'sqrt':  return Math.sqrt(a[0])
      case 'cbrt':  return Math.cbrt(a[0])
      case 'abs':   return Math.abs(a[0])
      case 'floor': return Math.floor(a[0])
      case 'ceil':  return Math.ceil(a[0])
      case 'round': return Math.round(a[0])
      case 'exp':   return Math.exp(a[0])
      case 'sign':  return Math.sign(a[0])
      case 'pow':   return Math.pow(a[0], a[1])
      case 'max':   return Math.max(...a)
      case 'min':   return Math.min(...a)
      case 'gcd': { let [x, y] = a.map(n => Math.abs(Math.round(n))); while (y) [x, y] = [y, x % y]; return x }
      case 'factorial': case 'fact': return factorial(a[0])
      default: throw new Error(`Unknown function: ${name}`)
    }
  }

  const peek = () => tokens[pos]
  const next = () => tokens[pos++]

  function parseExpr() { return parseAdd() }

  function parseAdd() {
    let v = parseMul()
    while (peek()?.t === 'OP' && '+-'.includes(peek().v)) {
      const op = next().v; const r = parseMul()
      v = op === '+' ? v + r : v - r
    }
    return v
  }

  function parseMul() {
    let v = parsePow()
    while (peek()?.t === 'OP' && '*/'.includes(peek().v)) {
      const op = next().v; const r = parsePow()
      if (op === '/' && r === 0) throw new Error('Division by zero')
      v = op === '*' ? v * r : v / r
    }
    return v
  }

  function parsePow() {
    let v = parseUnary()
    if (peek()?.t === 'OP' && peek().v === '^') { next(); v = Math.pow(v, parsePow()) }
    return v
  }

  function parseUnary() {
    if (peek()?.t === 'OP' && peek().v === '-') { next(); return -parsePost() }
    if (peek()?.t === 'OP' && peek().v === '+') { next() }
    return parsePost()
  }

  function parsePost() {
    let v = parsePrimary()
    for (;;) {
      if (peek()?.t === 'OP' && peek().v === '!') { next(); v = factorial(v) }
      else if (peek()?.t === 'OP' && peek().v === '%') { next(); v /= 100 }
      else break
    }
    return v
  }

  function parsePrimary() {
    const tok = peek()
    if (!tok) throw new Error('Unexpected end of expression')
    if (tok.t === 'N') { next(); return tok.v }
    if (tok.t === 'LP') {
      next(); const v = parseExpr()
      if (peek()?.t !== 'RP') throw new Error('Missing )')
      next(); return v
    }
    if (tok.t === 'I') {
      next()
      const name = tok.v.toLowerCase()
      if (name in CONSTS) return CONSTS[name]
      if (peek()?.t === 'LP') {
        next()
        const args = []
        if (peek()?.t !== 'RP') {
          args.push(parseExpr())
          while (peek()?.t === 'CM') { next(); args.push(parseExpr()) }
        }
        if (peek()?.t !== 'RP') throw new Error(`Missing ) after ${tok.v}(`)
        next(); return fn(name, args)
      }
      throw new Error(`Unknown identifier: ${tok.v}`)
    }
    throw new Error(`Unexpected: ${tok.v ?? tok.t}`)
  }

  const result = parseExpr()
  if (pos < tokens.length) throw new Error('Unexpected input')
  return result
}

// ── Button definitions ───────────────────────────────────────────────────────
const BTNS = [
  { l: 'sin',  i: 'sin(',  cls: 'fn' }, { l: 'cos',  i: 'cos(',  cls: 'fn' }, { l: 'tan',  i: 'tan(',  cls: 'fn' }, { l: 'ln',   i: 'ln(',   cls: 'fn' }, { l: 'log',  i: 'log(', cls: 'fn' },
  { l: 'x²',  i: '^2',   cls: 'fn' }, { l: '√',   i: 'sqrt(', cls: 'fn' }, { l: '^',    i: '^',    cls: 'op' }, { l: '(',    i: '(' }, { l: ')',  i: ')' },
  { l: 'π',   i: 'π' },               { l: 'e',   i: 'e' },                  { l: 'n!',  i: '!',    cls: 'fn' }, { l: '%',    i: '%' },   { l: '±', a: 'neg' },
  { l: '7',   i: '7' },               { l: '8',   i: '8' },                  { l: '9',   i: '9' },               { l: '÷',    i: '÷',   cls: 'op' }, { l: '⌫', a: 'del' },
  { l: '4',   i: '4' },               { l: '5',   i: '5' },                  { l: '6',   i: '6' },               { l: '×',    i: '×',   cls: 'op' }, { l: 'CE', a: 'clear', cls: 'op' },
  { l: '1',   i: '1' },               { l: '2',   i: '2' },                  { l: '3',   i: '3' },               { l: '−',    i: '−',   cls: 'op' }, { l: '=',  a: 'eval', cls: 'eq' },
  { l: '0',   i: '0' },               { l: '.',   i: '.' },                  { l: 'ANS', i: 'ans' },             { l: '+',    i: '+',   cls: 'op' }, { l: '1/x', i: '1/' },
]

function fmt(n) {
  if (!Number.isFinite(n)) return String(n)
  if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(10).replace(/\.?0+e/, 'e')
  const s = n.toPrecision(12)
  return String(+s)
}

export function ScientificCalculator() {
  const [expr, setExpr] = useState('')
  const [angleMode, setAngleMode] = useState('deg')
  const [history, setHistory] = useState([])
  const [ans, setAns] = useState(0)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  const liveResult = useMemo(() => {
    if (!expr.trim()) return null
    try {
      const v = evaluate(expr, angleMode, ans)
      return { value: v, display: fmt(v) }
    } catch {
      return null
    }
  }, [expr, angleMode, ans])

  const handleBtn = useCallback((btn) => {
    if (btn.a === 'del') { setExpr(e => e.slice(0, -1)); return }
    if (btn.a === 'clear') { setExpr(''); return }
    if (btn.a === 'neg') {
      setExpr(e => e.startsWith('-') ? e.slice(1) : '-' + e)
      return
    }
    if (btn.a === 'eval') {
      if (!expr.trim()) return
      try {
        const v = evaluate(expr, angleMode, ans)
        const entry = { expr, result: fmt(v), value: v }
        setHistory(h => [entry, ...h].slice(0, 20))
        setAns(v)
        setExpr(fmt(v))
      } catch (e) {
        flash(e.message)
      }
      return
    }
    setExpr(e => e + btn.i)
    inputRef.current?.focus()
  }, [expr, angleMode, ans])

  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBtn({ a: 'eval' })
    }
  }

  async function copyResult() {
    const val = liveResult?.display ?? ''
    if (!val) return
    await navigator.clipboard.writeText(val)
    flash('Copied')
  }

  return (
    <div className="tool-body sci-calc-tool">
      <div className="sci-calc-left">
        <div className="sci-calc-display">
          <div className="sci-calc-expr-row">
            <input
              ref={inputRef}
              type="text"
              className="sci-calc-expr-input"
              value={expr}
              onChange={e => setExpr(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type or use buttons…"
              spellCheck={false}
            />
          </div>
          <div className="sci-calc-result">
            {liveResult ? liveResult.display : <span className="sci-calc-placeholder">—</span>}
          </div>
          <div className="sci-calc-meta">
            <button
              type="button"
              className={`sci-calc-mode-btn ${angleMode === 'deg' ? 'active' : ''}`}
              onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')}
            >
              {angleMode.toUpperCase()}
            </button>
            <button type="button" className="icon-button" onClick={copyResult} title="Copy result">
              <Clipboard size={14} />
            </button>
          </div>
        </div>

        <div className="sci-calc-grid">
          {BTNS.map((btn, i) => (
            <button
              key={i}
              type="button"
              className={`sci-calc-btn ${btn.cls ?? ''}`}
              onClick={() => handleBtn(btn)}
            >
              {btn.cls === 'del' ? <Delete size={16} /> : btn.l}
            </button>
          ))}
        </div>

        <p className="helper-text">{message || 'Press Enter or = to evaluate. ANS uses the last result.'}</p>
      </div>

      {history.length > 0 && (
        <div className="sci-calc-history">
          <div className="section-title-row">
            <span className="section-title">History</span>
            <button type="button" className="secondary-button" onClick={() => setHistory([])}>Clear</button>
          </div>
          <div className="sci-calc-history-list">
            {history.map((h, i) => (
              <button
                key={i}
                type="button"
                className="sci-calc-history-item"
                onClick={() => { setExpr(h.result); setAns(h.value) }}
                title="Restore"
              >
                <span className="sci-calc-history-expr">{h.expr}</span>
                <span className="sci-calc-history-result">= {h.result}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
