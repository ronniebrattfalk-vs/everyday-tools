import { useEffect, useMemo, useState } from 'react'
import { Plus, Printer, Trash2 } from 'lucide-react'

const SENDER_KEY = 'everyday-tools-quote-sender'

function loadSender() {
  try { return JSON.parse(localStorage.getItem(SENDER_KEY) || 'null') } catch { return null }
}
function saveSender(s) { try { localStorage.setItem(SENDER_KEY, JSON.stringify(s)) } catch {} }

const DEFAULT_SENDER = { name: '', company: '', email: '', phone: '', address: '' }
const EMPTY_LINE = { description: '', qty: '1', price: '' }

function usd(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
function uid() { return Math.random().toString(36).slice(2, 9) }
function today() { return new Date().toISOString().slice(0, 10) }

export function QuoteGenerator() {
  const [sender,     setSender]     = useState(() => loadSender() ?? DEFAULT_SENDER)
  const [client,     setClient]     = useState({ name: '', company: '', email: '' })
  const [quoteNum,   setQuoteNum]   = useState(() => `Q-${Date.now().toString().slice(-6)}`)
  const [quoteDate,  setQuoteDate]  = useState(today)
  const [validDays,  setValidDays]  = useState('30')
  const [lines,      setLines]      = useState([{ id: uid(), ...EMPTY_LINE }])
  const [discount,   setDiscount]   = useState('0')
  const [tax,        setTax]        = useState('0')
  const [notes,      setNotes]      = useState('')

  useEffect(() => { saveSender(sender) }, [sender])

  function setSenderField(k, v) { setSender(s => ({ ...s, [k]: v })) }
  function setClientField(k, v) { setClient(c => ({ ...c, [k]: v })) }

  function addLine() { setLines(l => [...l, { id: uid(), ...EMPTY_LINE }]) }
  function removeLine(id) { setLines(l => l.filter(x => x.id !== id)) }
  function setLineField(id, k, v) { setLines(l => l.map(x => x.id === id ? { ...x, [k]: v } : x)) }

  const subtotal = useMemo(() =>
    lines.reduce((s, l) => {
      const q = parseFloat(l.qty) || 0
      const p = parseFloat(l.price) || 0
      return s + q * p
    }, 0),
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
                  className="icon-button quote-col-del"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length === 1}
                  title="Remove line"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
          <button type="button" className="secondary-button quote-add-line" onClick={addLine}>
            <Plus size={13} style={ICN} />Add Line
          </button>
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
