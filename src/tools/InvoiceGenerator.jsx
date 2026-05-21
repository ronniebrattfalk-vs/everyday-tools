import { useMemo, useState } from 'react'
import { Download, ImagePlus, Plus, Printer, RotateCcw, Save, Trash2 } from 'lucide-react'

const draftKey = 'everyday-tools.invoice-draft'

const defaultInvoice = {
  senderName: 'Your Company AB',
  senderDetails: 'Street 1\n123 45 City\nVAT SE000000000001',
  clientName: 'Client Company',
  clientDetails: 'Client Street 2\n543 21 City',
  invoiceNumber: `INV-${new Date().getFullYear()}-001`,
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  currency: 'SEK',
  taxRate: 25,
  discount: 0,
  logoDataUrl: '',
  paymentDetails: 'Bankgiro: 000-0000\nIBAN: SE00 0000 0000 0000 0000 0000\nReference: invoice number',
  notes: 'Payment due within 14 days. Thank you for your business.',
  items: [
    {
      id: crypto.randomUUID(),
      description: 'Consulting work',
      quantity: 1,
      unitPrice: 950,
    },
  ],
}

function money(value, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function numeric(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textareaLines(value) {
  return String(value)
    .split('\n')
    .map((line, index) => <span key={`${line}-${index}`}>{line || '\u00a0'}</span>)
}

export function InvoiceGenerator() {
  const [invoice, setInvoice] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      return saved ? { ...defaultInvoice, ...JSON.parse(saved) } : defaultInvoice
    } catch {
      return defaultInvoice
    }
  })
  const [message, setMessage] = useState('')

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => {
      return sum + numeric(item.quantity) * numeric(item.unitPrice)
    }, 0)
    const discount = Math.min(subtotal, numeric(invoice.discount))
    const taxable = Math.max(0, subtotal - discount)
    const tax = taxable * (numeric(invoice.taxRate) / 100)
    return {
      subtotal,
      discount,
      tax,
      total: taxable + tax,
    }
  }, [invoice.discount, invoice.items, invoice.taxRate])

  function updateField(field, value) {
    setInvoice((current) => ({ ...current, [field]: value }))
    setMessage('')
  }

  function updateItem(id, field, value) {
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
    setMessage('')
  }

  function addItem() {
    setInvoice((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }))
  }

  function removeItem(id) {
    setInvoice((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((item) => item.id !== id),
    }))
  }

  function saveDraft() {
    localStorage.setItem(draftKey, JSON.stringify(invoice))
    setMessage('Draft saved in this browser')
  }

  function resetDraft() {
    localStorage.removeItem(draftKey)
    setInvoice(defaultInvoice)
    setMessage('Draft reset')
  }

  function loadLogo(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateField('logoDataUrl', String(reader.result || ''))
      setMessage('Logo added')
    }
    reader.readAsDataURL(file)
  }

  function printInvoice() {
    setMessage('Opening print dialog')
    window.print()
  }

  return (
    <div className="tool-body invoice-tool">
      <div className="invoice-editor">
        <section className="invoice-form-section">
          <h3>Invoice Details</h3>
          <div className="form-grid thirds">
            <label>
              Invoice number
              <input value={invoice.invoiceNumber} onChange={(event) => updateField('invoiceNumber', event.target.value)} />
            </label>
            <label>
              Invoice date
              <input type="date" value={invoice.invoiceDate} onChange={(event) => updateField('invoiceDate', event.target.value)} />
            </label>
            <label>
              Due date
              <input type="date" value={invoice.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} />
            </label>
          </div>
          <div className="form-grid thirds">
            <label>
              Currency
              <select value={invoice.currency} onChange={(event) => updateField('currency', event.target.value)}>
                <option value="SEK">SEK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label>
              Tax / VAT %
              <input
                type="number"
                min="0"
                step="0.01"
                value={invoice.taxRate}
                onChange={(event) => updateField('taxRate', event.target.value)}
              />
            </label>
            <label>
              Discount
              <input
                type="number"
                min="0"
                step="0.01"
                value={invoice.discount}
                onChange={(event) => updateField('discount', event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="invoice-form-section">
          <h3>Parties</h3>
          <div className="form-grid">
            <label>
              From
              <input value={invoice.senderName} onChange={(event) => updateField('senderName', event.target.value)} />
            </label>
            <label>
              To
              <input value={invoice.clientName} onChange={(event) => updateField('clientName', event.target.value)} />
            </label>
            <label>
              Sender details
              <textarea value={invoice.senderDetails} onChange={(event) => updateField('senderDetails', event.target.value)} />
            </label>
            <label>
              Client details
              <textarea value={invoice.clientDetails} onChange={(event) => updateField('clientDetails', event.target.value)} />
            </label>
          </div>
        </section>

        <section className="invoice-form-section">
          <div className="section-title-row">
            <h3>Line Items</h3>
            <button type="button" className="secondary-button" onClick={addItem}>
              <Plus size={17} aria-hidden="true" />
              Add item
            </button>
          </div>

          <div className="invoice-items">
            {invoice.items.map((item) => (
              <div className="invoice-item-row" key={item.id}>
                <label>
                  Description
                  <input value={item.description} onChange={(event) => updateItem(item.id, 'description', event.target.value)} />
                </label>
                <label>
                  Qty
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
                  />
                </label>
                <label>
                  Unit price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(item.id, 'unitPrice', event.target.value)}
                  />
                </label>
                <button type="button" className="icon-button danger" onClick={() => removeItem(item.id)} aria-label="Remove line item">
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="invoice-form-section">
          <div className="section-title-row">
            <h3>Branding & Payment</h3>
            <label className="secondary-button file-button">
              <ImagePlus size={17} aria-hidden="true" />
              Upload logo
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => loadLogo(event.target.files?.[0])} />
            </label>
          </div>
          <label>
            Payment details
            <textarea value={invoice.paymentDetails} onChange={(event) => updateField('paymentDetails', event.target.value)} />
          </label>
        </section>

        <section className="invoice-form-section">
          <label>
            Notes / payment terms
            <textarea value={invoice.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </label>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={printInvoice}>
              <Printer size={17} aria-hidden="true" />
              Print / PDF
            </button>
            <button type="button" className="secondary-button" onClick={saveDraft}>
              <Save size={17} aria-hidden="true" />
              Save draft
            </button>
            <button type="button" className="secondary-button" onClick={resetDraft}>
              <RotateCcw size={17} aria-hidden="true" />
              Reset
            </button>
          </div>
          <p className="helper-text">{message || 'Drafts stay in localStorage on this browser only.'}</p>
        </section>
      </div>

      <aside className="invoice-preview" aria-label="Invoice preview">
        <div className="invoice-paper">
          <div className="invoice-paper-header">
            <div>
              <p>Invoice</p>
              <h3>{invoice.invoiceNumber || 'Draft'}</h3>
            </div>
            {invoice.logoDataUrl ? (
              <img className="invoice-logo" src={invoice.logoDataUrl} alt="" />
            ) : (
              <Download size={28} aria-hidden="true" />
            )}
          </div>

          <div className="invoice-party-grid">
            <div>
              <span>From</span>
              <strong>{invoice.senderName || 'Sender'}</strong>
              <p>{textareaLines(invoice.senderDetails)}</p>
            </div>
            <div>
              <span>Bill To</span>
              <strong>{invoice.clientName || 'Client'}</strong>
              <p>{textareaLines(invoice.clientDetails)}</p>
            </div>
          </div>

          <dl className="invoice-meta">
            <div>
              <dt>Invoice date</dt>
              <dd>{invoice.invoiceDate}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{invoice.dueDate}</dd>
            </div>
          </dl>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description || 'Line item'}</td>
                  <td>{numeric(item.quantity)}</td>
                  <td>{money(numeric(item.unitPrice), invoice.currency)}</td>
                  <td>{money(numeric(item.quantity) * numeric(item.unitPrice), invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-total-box">
            <div>
              <span>Subtotal</span>
              <strong>{money(totals.subtotal, invoice.currency)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>-{money(totals.discount, invoice.currency)}</strong>
            </div>
            <div>
              <span>Tax / VAT {numeric(invoice.taxRate)}%</span>
              <strong>{money(totals.tax, invoice.currency)}</strong>
            </div>
            <div className="grand-total">
              <span>Total</span>
              <strong>{money(totals.total, invoice.currency)}</strong>
            </div>
          </div>

          <div className="invoice-notes">
            <span>Payment</span>
            <p>{textareaLines(invoice.paymentDetails)}</p>
          </div>

          <div className="invoice-notes">
            <span>Notes</span>
            <p>{textareaLines(invoice.notes)}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
