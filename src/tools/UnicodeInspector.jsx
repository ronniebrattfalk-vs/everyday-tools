import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

function utf8Bytes(cp) {
  if (cp <= 0x7f) return [cp]
  if (cp <= 0x7ff) return [0xc0 | (cp >> 6), 0x80 | (cp & 0x3f)]
  if (cp <= 0xffff) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)]
  return [
    0xf0 | (cp >> 18),
    0x80 | ((cp >> 12) & 0x3f),
    0x80 | ((cp >> 6) & 0x3f),
    0x80 | (cp & 0x3f),
  ]
}

function hexByte(n) {
  return n.toString(16).toUpperCase().padStart(2, '0')
}

function jsEscape(cp) {
  if (cp <= 0xffff) return `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`
  const hi = Math.floor((cp - 0x10000) / 0x400) + 0xd800
  const lo = ((cp - 0x10000) % 0x400) + 0xdc00
  return `\\u${hi.toString(16).toUpperCase()}\\u${lo.toString(16).toUpperCase()}`
}

function pythonEscape(cp) {
  if (cp <= 0xffff) return `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`
  return `\\U${cp.toString(16).toUpperCase().padStart(8, '0')}`
}

function htmlEntity(cp) {
  return `&#${cp};`
}

function htmlNamedEntity(char) {
  const named = {
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
    ' ': '&nbsp;', '©': '&copy;', '®': '&reg;', '™': '&trade;',
    '€': '&euro;', '£': '&pound;', '¥': '&yen;', '°': '&deg;',
    '±': '&plusmn;', '×': '&times;', '÷': '&divide;',
  }
  return named[char] || null
}

function analyzeChar(char) {
  const cp = char.codePointAt(0)
  const bytes = utf8Bytes(cp)
  const named = htmlNamedEntity(char)
  return {
    char,
    cp,
    hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
    decimal: cp,
    utf8: bytes.map(hexByte).join(' '),
    utf8Escape: bytes.map((b) => `\\x${hexByte(b)}`).join(''),
    jsEscape: jsEscape(cp),
    pythonEscape: pythonEscape(cp),
    htmlDecimal: htmlEntity(cp),
    htmlNamed: named,
  }
}

function getChars(text) {
  return [...text]
}

const SAMPLE = 'Hello, 世界! €42 😀'

export function UnicodeInspector() {
  const [input, setInput] = useState(SAMPLE)
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')

  const chars = useMemo(() => getChars(input), [input])

  const active = useMemo(() => {
    if (selected !== null && chars[selected]) return analyzeChar(chars[selected])
    if (chars.length === 1) return analyzeChar(chars[0])
    return null
  }, [chars, selected])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1500)
  }

  async function copy(text) {
    await navigator.clipboard.writeText(text)
    flash('Copied')
  }

  return (
    <div className="tool-body unicode-tool">
      <div className="unicode-left">
        <label className="field-label">
          Text to inspect
          <textarea
            className="unicode-textarea"
            value={input}
            onChange={(e) => { setInput(e.target.value); setSelected(null) }}
            spellCheck={false}
            placeholder="Type or paste text…"
          />
        </label>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => { setInput(''); setSelected(null) }}>
            <RotateCcw size={16} aria-hidden="true" />
            Clear
          </button>
        </div>

        {chars.length > 0 && (
          <div className="unicode-char-grid">
            {chars.map((ch, i) => {
              const cp = ch.codePointAt(0)
              return (
                <button
                  key={i}
                  type="button"
                  className={`unicode-char-cell ${selected === i ? 'active' : ''}`}
                  onClick={() => setSelected(i === selected ? null : i)}
                  title={`U+${cp.toString(16).toUpperCase().padStart(4, '0')}`}
                >
                  <span className="unicode-char-glyph">{ch}</span>
                  <span className="unicode-char-cp">U+{cp.toString(16).toUpperCase().padStart(4, '0')}</span>
                </button>
              )
            })}
          </div>
        )}

        <p className="helper-text">
          {chars.length} code point{chars.length !== 1 ? 's' : ''} · {new TextEncoder().encode(input).length} UTF-8 bytes
        </p>
      </div>

      <div className="unicode-right">
        {active ? (
          <>
            <div className="unicode-detail-glyph">{active.char}</div>

            <table className="unicode-detail-table">
              <tbody>
                <tr>
                  <th>Code point</th>
                  <td>
                    <code>{active.hex}</code>
                    <button type="button" className="icon-button" onClick={() => copy(active.hex)} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>Decimal</th>
                  <td>
                    <code>{active.decimal}</code>
                    <button type="button" className="icon-button" onClick={() => copy(String(active.decimal))} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>UTF-8 bytes</th>
                  <td>
                    <code>{active.utf8}</code>
                    <button type="button" className="icon-button" onClick={() => copy(active.utf8)} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>UTF-8 escape</th>
                  <td>
                    <code>{active.utf8Escape}</code>
                    <button type="button" className="icon-button" onClick={() => copy(active.utf8Escape)} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>JS escape</th>
                  <td>
                    <code>{active.jsEscape}</code>
                    <button type="button" className="icon-button" onClick={() => copy(active.jsEscape)} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>Python escape</th>
                  <td>
                    <code>{active.pythonEscape}</code>
                    <button type="button" className="icon-button" onClick={() => copy(active.pythonEscape)} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>HTML decimal</th>
                  <td>
                    <code>{active.htmlDecimal}</code>
                    <button type="button" className="icon-button" onClick={() => copy(active.htmlDecimal)} title="Copy">
                      <Clipboard size={14} />
                    </button>
                  </td>
                </tr>
                {active.htmlNamed && (
                  <tr>
                    <th>HTML named</th>
                    <td>
                      <code>{active.htmlNamed}</code>
                      <button type="button" className="icon-button" onClick={() => copy(active.htmlNamed)} title="Copy">
                        <Clipboard size={14} />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <div className="empty-state">
            <p>{input.trim() ? 'Click a character to inspect it.' : 'Type or paste text to begin.'}</p>
          </div>
        )}
      </div>

      <p className="helper-text unicode-footer">{message || ' '}</p>
    </div>
  )
}
