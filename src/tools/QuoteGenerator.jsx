import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, Printer, Save, Trash2, X } from 'lucide-react'

const SENDER_KEY   = 'everyday-tools-quote-sender'
const TMPL_KEY     = 'everyday-tools-quote-templates'
const LINE_LIB_KEY = 'everyday-tools-quote-line-lib'

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ } }

const DEFAULT_SENDER = { name: '', company: '', email: '', phone: '', address: '' }
const EMPTY_LINE = { description: '', qty: '1', price: '' }

function usd(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
function uid() { return Math.random().toString(36).slice(2, 9) }
function today() { return new Date().toISOString().slice(0, 10) }

export function QuoteGenerator() {
  const [sender,    setSender]    = useState(() => loadJson(SENDER_KEY, DEFAULT_SENDER))
  const [client,    setClient]    = useState({ name: '', company: '', email: '' })
  const [quoteNum,  setQuoteNum]  = useState(() => `Q-${Date.now().toString().slice(-6)}`)
  const [quoteDate, setQuoteDate] = useState(today)
  const [validDays, setValidDays] = useState('30')
  const [lines,     setLines]     = useState([{ id: uid(), ...EMPTY_LINE }])
  const [discount,  setDiscount]  = useState('0')
  const [tax,       setTax]       = useState('0')
  const [notes,     setNotes]     = useState('')

  const [templates,       setTemplates]       = useState(() => loadJson(TMPL_KEY, []))
  const [lineLib,         setLineLib]         = useState(() => loadJson(LINE_LIB_KEY, []))
  const [tmplName,        setTmplName]        = useState('')
  const [selectedTmplId,  setSelectedTmplId]  = useState('')
  const [showLineLib,     setShowLineLib]      = useState(false)
  const [message,         setMessage]         = useState('')

  useEffect(() => { saveJson(SENDER_KEY, sender) }, [sender])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1800) }

  function setSenderField(k, v) { setSender(s => ({ ...s, [k]: v })) }
  function setClientField(k, v) { setClient(c => ({ ...c, [k]: v })) }

  function addLine() { setLines(l => [...l, { id: uid(), ...EMPTY_LINE }]) }
  function removeLine(id) { setLines(l => l.filter(x => x.id !== id)) }
  function setLineField(id, k, v) { setLines(l => l.map(x => x.id === id ? { ...x, [k]: v } : x)) }

  const subtotal = useMemo(() =>
    lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0), 0),
    [lines]
  )
  const discountAmt = subtotal * (parseFloat(discount) || 0) / 100
  const taxableAmt  = subtotal - discountAmt
  const taxAmt      = taxableAmt * (parseFloat(tax) || 0) / 100
  const total       = taxableAmt + taxAmt

  const expiryDate = useMemo(() => {
    const d = new Date(quoteDate)
    d.setDate(d.getDate() + (parseInt(validDays) || 30))
    return d.toISOString().slice(0, 10)
  }, [quoteDate, validDays])

  // ── Quote templates ───────────────────────────────────

  function saveTemplate() {
    const name = tmplName.trim()
    if (!name) { flash('Add a template name first'); return }
    const tmpl = { id: uid(), name, notes, validDays, discount, tax }
    setTemplates(current => {
      const next = [...current, tmpl]
      saveJson(TMPL_KEY, next)
      return next
    })
    setSelectedTmplId(tmpl.id)
    setTmplName('')
    flash(`Saved template "${name}"`)
  }

  function applyTemplate() {
    const tmpl = templates.find(t => t.id === selectedTmplId)
    if (!tmpl) return
    setNotes(tmpl.notes)
    setValidDays(tmpl.validDays)
    setDiscount(tmpl.discount)
    setTax(tmpl.tax)
    flash(`Applied template "${tmpl.name}"`)
  }

  function deleteTemplate() {
    if (!selectedTmplId) return
    setTemplates(current => {
      const next = current.filter(t => t.id !== selectedTmplId)
      saveJson(TMPL_KEY, next)
      return next
    })
    setSelectedTmplId('')
    flash('Template removed')
  }

  // ── Line-item library ─────────────────────────────────

  function saveLineToLib(line) {
    if (!line.description.trim()) { flash('Add a description before saving'); return }
    const entry = { id: uid(), description: line.description, qty: line.qty, price: line.price }
    setLineLib(current => {
      const next = [...current, entry]
      saveJson(LINE_LIB_KEY, next)
      return next
    })
    flash(`Saved "${line.description}" to library`)
  }

  function addLibLine(entry) {
    setLines(l => [...l, { id: uid(), description: entry.description, qty: entry.qty, price: entry.price }])
    flash(`Added "${entry.description}"`)
  }

  function deleteLibLine(id) {
    setLineLib(current => {
      const next = current.filter(e => e.id !== id)
      saveJson(LINE_LIB_KEY, next)
      return next
    })
  }

  const hasDiscount = (parseFloat(discount) || 0) > 0
  const hasTax      = (parseFloat(tax) || 0) > 0
  const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 4 }

  return (
    <div className="tool-body quote-tool">
      <div className="quote-form-area">

        <div className="quote-section-title">Your Details</div>
        <div className="quote-sender-grid">
          {[['name','Your Name'],['company','Company'],['email','Email'],['phone','Phone'],['address','Address']].map(([k, ph]) => (
            <div key={k} className={`field-group ${k === 'address' ? 'quote-span-2' : ''}`}>
              <label className="field-label">{ph}</label>
              <input
                type="text"
                className="text-input"
                value={sender[k]}
                onChange={e => setSenderField(k, e.target.value)}
                placeholder={ph}
              />
            </div>
          ))}
        </div>

        <div className="quote-section-title">Client Details</div>
        <div className="quote-sender-grid">
          {[['name','Client Name'],['company','Company'],['email','Email']].map(([k, ph]) => (
            <div key={k} className="field-group">
              <label className="field-label">{ph}</label>
              <input
                type="text"
                className="text-input"
                value={client[k]}
                onChange={e => setClientField(k, e.target.value)}
                placeholder={ph}
              />
            </div>
          ))}
        </div>

        <div className="quote-meta-row">
          <div className="field-group">
            <label className="field-label">Quote #</label>
            <input type="text" className="text-input" value={quoteNum} onChange={e => setQuoteNum(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Date</label>
            <input type="date" className="text-input" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Valid (days)</label>
            <input type="number" className="text-input" value={validDays} min={1} onChange={e => setValidDays(e.target.value)} />
          </div>
        </div>

        <div className="quote-section-title">Line Items</div>
        <div className="quote-lines">
          <div className="quote-lines-header">
            <span className="quote-col-desc">Description</span>
            <span className="quote-col-qty">Qty</span>
            <span className="quote-col-price">Unit Price</span>
            <span className="quote-col-total">Total</span>
            <span className="quote-col-del" />
          </div>
          {lines.map(line => {
            const lineTotal = (parseFloat(line.qty) || 0) * (parseFloat(line.price) || 0)
            return (
              <div key={line.id} className="quote-line-row">
                <input
                  type="text"
                  className="text-input quote-col-desc"
                  value={line.description}
                  onChange={e => setLineField(line.id, 'description', e.target.value)}
                  placeholder="Service or product description"
                />
                <input
                  type="number"
                  className="text-input quote-col-qty"
                  value={line.qty}
                  min={0}
                  step="0.01"
                  onChange={e => setLineField(line.id, 'qty', e.target.value)}
                />
                <input
                  type="number"
                  className="text-input quote-col-price"
                  value={line.price}
                  min={0}
                  step="0.01"
                  onChange={e => setLineField(line.id, 'price', e.target.value)}
                  placeholder="0.00"
                />
                <span className="quote-col-total quote-line-total">{usd(lineTotal)}</span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => saveLineToLib(line)}
                  title="Save to library"
                  aria-label="Save line to library"
                >
                  <BookOpen size={13} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length === 1}
                  title="Remove line"
                  aria-label="Remove line"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
          <div className="quote-line-actions">
            <button type="button" className="secondary-button" onClick={addLine}>
              <Plus size={13} style={ICN} />Add Line
            </button>
            <button
              type="button"
              className={`secondary-button${showLineLib ? ' is-active' : ''}`}
              onClick={() => setShowLineLib(v => !v)}
            >
              <BookOpen size={13} style={ICN} />Library{lineLib.length > 0 ? ` (${lineLib.length})` : ''}
            </button>
          </div>
          {showLineLib && (
            <div className="quote-lib-panel">
              {lineLib.length === 0
                ? <p className="helper-text">No saved items. Click the bookmark icon on any line to save it here.</p>
                : lineLib.map(entry => (
                    <div key={entry.id} className="quote-lib-entry">
                      <span className="quote-lib-desc">{entry.description}</span>
                      <span className="quote-lib-meta">{entry.qty} × {entry.price ? usd(parseFloat(entry.price)) : '—'}</span>
                      <button type="button" className="secondary-button" onClick={() => addLibLine(entry)}>
                        <Plus size={11} style={ICN} />Add
                      </button>
                      <button type="button" className="icon-button" onClick={() => deleteLibLine(entry.id)} aria-label="Remove from library">
                        <X size={11} />
                      </button>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        <div className="quote-totals-form">
          <div className="field-group">
            <label className="field-label">Discount (%)</label>
            <input type="number" className="text-input" value={discount} min={0} max={100} step="0.1" onChange={e => setDiscount(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Tax (%)</label>
            <input type="number" className="text-input" value={tax} min={0} max={100} step="0.1" onChange={e => setTax(e.target.value)} />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Notes (optional)</label>
          <textarea
            className="text-input"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Payment terms, delivery details, or any other notes..."
          />
        </div>

        <div className="quote-section-title">Templates</div>
        <div className="quote-tmpl-row">
          <div className="field-group">
            <label className="field-label">Saved templates</label>
            <select value={selectedTmplId} onChange={e => setSelectedTmplId(e.target.value)}>
              <option value="">Choose a saved template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="button-row" style={{ marginTop: 0, alignSelf: 'flex-end' }}>
            <button type="button" className="secondary-button" onClick={applyTemplate} disabled={!selectedTmplId}>
              Apply
            </button>
            <button type="button" className="secondary-button" onClick={deleteTemplate} disabled={!selectedTmplId}>
              Delete
            </button>
          </div>
        </div>
        <div className="quote-tmpl-save">
          <input
            className="text-input"
            value={tmplName}
            onChange={e => setTmplName(e.target.value)}
            placeholder="Template name, e.g. Standard consulting"
          />
          <button type="button" className="secondary-button" onClick={saveTemplate}>
            <Save size={14} style={ICN} />Save current as template
          </button>
        </div>
        <p className="helper-text" style={{ marginTop: 4 }}>
          {message || 'Templates save notes, valid days, discount, and tax. Line items are saved separately via the library.'}
        </p>
      </div>

      <div className="quote-preview-area" id="quote-print-target">
        <div className="quote-preview-header">
          <div className="quote-preview-from">
            <strong>{sender.name || 'Your Name'}</strong>
            {sender.company && <div>{sender.company}</div>}
            {sender.email   && <div>{sender.email}</div>}
            {sender.phone   && <div>{sender.phone}</div>}
            {sender.address && <div style={{ whiteSpace: 'pre-line' }}>{sender.address}</div>}
          </div>
          <div className="quote-preview-title-block">
            <div className="quote-preview-badge">QUOTE</div>
            <div className="quote-preview-meta">
              <span>#{quoteNum}</span>
              <span>Issued: {quoteDate}</span>
              <span>Valid until: {expiryDate}</span>
            </div>
          </div>
        </div>

        {(client.name || client.company) && (
          <div className="quote-preview-to">
            <div className="quote-preview-to-label">Bill To</div>
            {client.name    && <div><strong>{client.name}</strong></div>}
            {client.company && <div>{client.company}</div>}
            {client.email   && <div>{client.email}</div>}
          </div>
        )}

        <table className="quote-preview-table">
          <thead>
            <tr>
              <th className="qt-desc">Description</th>
              <th className="qt-num">Qty</th>
              <th className="qt-num">Unit Price</th>
              <th className="qt-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(line => {
              const lineTotal = (parseFloat(line.qty) || 0) * (parseFloat(line.price) || 0)
              return (
                <tr key={line.id}>
                  <td>{line.description || <em style={{ opacity: 0.4 }}>—</em>}</td>
                  <td className="qt-num">{line.qty}</td>
                  <td className="qt-num">{line.price ? usd(parseFloat(line.price)) : '—'}</td>
                  <td className="qt-num">{usd(lineTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="quote-preview-summary">
          <div className="qt-summary-row"><span>Subtotal</span><span>{usd(subtotal)}</span></div>
          {hasDiscount && <div className="qt-summary-row qt-discount"><span>Discount ({discount}%)</span><span>− {usd(discountAmt)}</span></div>}
          {hasTax && <div className="qt-summary-row"><span>Tax ({tax}%)</span><span>{usd(taxAmt)}</span></div>}
          <div className="qt-summary-row qt-total"><span>Total</span><span>{usd(total)}</span></div>
        </div>

        {notes && <div className="quote-preview-notes"><strong>Notes</strong><p>{notes}</p></div>}
      </div>

      <div className="quote-actions">
        <button type="button" className="primary-button" onClick={() => window.print()}>
          <Printer size={15} style={ICN} />Print / Save PDF
        </button>
      </div>

      <p className="helper-text">Your sender details are remembered in this browser. Use Print / Save PDF to export.</p>
    </div>
  )
}
