import { useMemo, useState } from 'react'
import { BookOpen, Download, ImagePlus, Palette, Plus, Printer, RotateCcw, Save, Trash2, UserPlus, X } from 'lucide-react'

const draftKey        = 'everyday-tools.invoice-draft'
const presetKey       = 'everyday-tools.invoice-presets'
const clientsKey      = 'everyday-tools.invoice-clients'
const lineItemLibKey  = 'everyday-tools.invoice-line-lib'

const invoiceTemplates = [
  {
    id: 'clean-consulting',
    name: 'Clean Consulting',
    description: 'Calm blue header with a classic invoice layout.',
    accentColor: '#1d4ed8',
    layout: 'classic',
    defaults: {
      notes: 'Payment due within 14 days. Thank you for your business.',
      paymentDetails: 'Bankgiro: 000-0000\nIBAN: SE00 0000 0000 0000 0000 0000\nReference: invoice number',
      taxRate: 25,
    },
  },
  {
    id: 'studio-highlight',
    name: 'Studio Highlight',
    description: 'Warmer accent color with a more visual split layout.',
    accentColor: '#c2410c',
    layout: 'split',
    defaults: {
      notes: 'Please include the invoice number in your payment reference.',
      paymentDetails: 'Swish: 123 456 78 90\nReference: invoice number',
      taxRate: 25,
    },
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Monochrome compact layout for simple service invoices.',
    accentColor: '#0f172a',
    layout: 'compact',
    defaults: {
      notes: 'Thank you. Payment terms: net 14 days.',
      paymentDetails: 'Bank transfer\nReference: invoice number',
      taxRate: 0,
    },
  },
]

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
  templateId: 'clean-consulting',
  accentColor: '#1d4ed8',
  layout: 'classic',
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
    .map((line, index) => <span key={`${line}-${index}`}>{line || ' '}</span>)
}

function createLineItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    ...overrides,
  }
}

function buildPresetSnapshot(invoice) {
  return {
    senderName: invoice.senderName,
    senderDetails: invoice.senderDetails,
    currency: invoice.currency,
    taxRate: invoice.taxRate,
    discount: invoice.discount,
    logoDataUrl: invoice.logoDataUrl,
    paymentDetails: invoice.paymentDetails,
    notes: invoice.notes,
    templateId: invoice.templateId,
    accentColor: invoice.accentColor,
    layout: invoice.layout,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }
}

function buildDraftSnapshot(invoice) {
  return {
    ...invoice,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }
}

function hydrateInvoice(snapshot = {}) {
  return {
    ...defaultInvoice,
    ...snapshot,
    items: (snapshot.items || defaultInvoice.items).map((item) => createLineItem(item)),
  }
}

function hydratePreset(preset) {
  return {
    ...preset,
    id: preset.id || crypto.randomUUID(),
    invoice: buildPresetSnapshot(hydrateInvoice(preset.invoice)),
  }
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function InvoiceGenerator() {
  const [invoice, setInvoice] = useState(() => {
    const saved = loadJson(draftKey, null)
    return saved ? hydrateInvoice(saved) : defaultInvoice
  })
  const [presets, setPresets] = useState(() =>
    (loadJson(presetKey, [])).map(hydratePreset)
  )
  const [clients, setClients] = useState(() => loadJson(clientsKey, []))
  const [lineItemLib, setLineItemLib] = useState(() => loadJson(lineItemLibKey, []))

  const [presetName, setPresetName] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [clientName, setClientName] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [showLineLib, setShowLineLib] = useState(false)
  const [message, setMessage] = useState('')
  const [isLogoDragging, setIsLogoDragging] = useState(false)

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

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1800)
  }

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
      items: [...current.items, createLineItem()],
    }))
  }

  function removeItem(id) {
    setInvoice((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((item) => item.id !== id),
    }))
  }

  function saveDraft() {
    saveJson(draftKey, buildDraftSnapshot(invoice))
    flash('Draft saved in this browser')
  }

  function resetDraft() {
    localStorage.removeItem(draftKey)
    setInvoice(defaultInvoice)
    flash('Draft reset')
  }

  function loadLogo(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateField('logoDataUrl', String(reader.result || ''))
      flash('Logo added')
    }
    reader.readAsDataURL(file)
  }

  function printInvoice() {
    flash('Opening print dialog')
    window.print()
  }

  function applyBuiltInTemplate(templateId) {
    const template = invoiceTemplates.find((item) => item.id === templateId)
    if (!template) return
    setInvoice((current) => ({
      ...current,
      templateId: template.id,
      accentColor: template.accentColor,
      layout: template.layout,
      ...template.defaults,
    }))
    flash(`${template.name} template applied`)
  }

  // ── Layout presets ────────────────────────────────────

  function savePreset() {
    const trimmedName = presetName.trim()
    if (!trimmedName) { flash('Add a preset name first'); return }
    const nextPreset = { id: crypto.randomUUID(), name: trimmedName, invoice: buildPresetSnapshot(invoice) }
    setPresets((current) => {
      const next = [...current, nextPreset]
      saveJson(presetKey, next)
      return next
    })
    setSelectedPresetId(nextPreset.id)
    setPresetName('')
    flash(`Saved preset "${trimmedName}"`)
  }

  function applySavedPreset() {
    const preset = presets.find((item) => item.id === selectedPresetId)
    if (!preset) return
    setInvoice((current) => ({
      ...current,
      ...hydrateInvoice(preset.invoice),
      clientName: current.clientName,
      clientDetails: current.clientDetails,
      invoiceNumber: current.invoiceNumber,
      invoiceDate: current.invoiceDate,
      dueDate: current.dueDate,
    }))
    flash(`Applied preset "${preset.name}"`)
  }

  function deletePreset() {
    if (!selectedPresetId) return
    setPresets((current) => {
      const next = current.filter((item) => item.id !== selectedPresetId)
      saveJson(presetKey, next)
      return next
    })
    setSelectedPresetId('')
    flash('Preset removed')
  }

  // ── Client profiles ───────────────────────────────────

  function saveClient() {
    const name = clientName.trim() || invoice.clientName.trim()
    if (!name) { flash('Add a client name first'); return }
    const nextClient = {
      id: crypto.randomUUID(),
      label: name,
      clientName: invoice.clientName,
      clientDetails: invoice.clientDetails,
    }
    setClients((current) => {
      const next = [...current, nextClient]
      saveJson(clientsKey, next)
      return next
    })
    setSelectedClientId(nextClient.id)
    setClientName('')
    flash(`Saved client "${name}"`)
  }

  function loadClient() {
    const client = clients.find((c) => c.id === selectedClientId)
    if (!client) return
    setInvoice((current) => ({
      ...current,
      clientName: client.clientName,
      clientDetails: client.clientDetails,
    }))
    flash(`Loaded client "${client.label}"`)
  }

  function deleteClient() {
    if (!selectedClientId) return
    setClients((current) => {
      const next = current.filter((c) => c.id !== selectedClientId)
      saveJson(clientsKey, next)
      return next
    })
    setSelectedClientId('')
    flash('Client removed')
  }

  // ── Line-item library ─────────────────────────────────

  function saveItemToLib(item) {
    if (!item.description.trim()) { flash('Add a description before saving to library'); return }
    const entry = {
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }
    setLineItemLib((current) => {
      const next = [...current, entry]
      saveJson(lineItemLibKey, next)
      return next
    })
    flash(`Saved "${item.description}" to library`)
  }

  function addLibItemToInvoice(entry) {
    setInvoice((current) => ({
      ...current,
      items: [...current.items, createLineItem({ description: entry.description, quantity: entry.quantity, unitPrice: entry.unitPrice })],
    }))
    flash(`Added "${entry.description}"`)
  }

  function deleteLibItem(id) {
    setLineItemLib((current) => {
      const next = current.filter((e) => e.id !== id)
      saveJson(lineItemLibKey, next)
      return next
    })
  }

  const activeTemplate = invoiceTemplates.find((template) => template.id === invoice.templateId)

  return (
    <div className="tool-body invoice-tool">
      <div className="invoice-editor">
        <section className="invoice-form-section">
          <div className="section-title-row">
            <h3>Template & Presets</h3>
            <span className="json-stat">{activeTemplate?.description || 'Customize your own layout locally'}</span>
          </div>
          <div className="form-grid">
            <label>
              Built-in template
              <select value={invoice.templateId} onChange={(event) => applyBuiltInTemplate(event.target.value)}>
                {invoiceTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Layout
              <select value={invoice.layout} onChange={(event) => updateField('layout', event.target.value)}>
                <option value="classic">Classic</option>
                <option value="split">Split</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label>
              Accent color
              <div className="invoice-accent-picker">
                <Palette size={16} aria-hidden="true" />
                <input type="color" value={invoice.accentColor} onChange={(event) => updateField('accentColor', event.target.value)} />
                <input value={invoice.accentColor} onChange={(event) => updateField('accentColor', event.target.value)} />
              </div>
            </label>
            <label>
              Save current setup as preset
              <div className="invoice-preset-save">
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="e.g. Monthly retainer"
                />
                <button type="button" className="secondary-button" onClick={savePreset}>
                  <Save size={17} aria-hidden="true" />
                  Save preset
                </button>
              </div>
            </label>
          </div>

          <div className="invoice-preset-row">
            <label>
              Saved presets
              <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
                <option value="">Choose a saved preset</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={applySavedPreset} disabled={!selectedPresetId}>
                Apply preset
              </button>
              <button type="button" className="secondary-button" onClick={deletePreset} disabled={!selectedPresetId}>
                Delete preset
              </button>
            </div>
          </div>
        </section>

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

          <div className="invoice-client-row">
            <label>
              Saved clients
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                <option value="">Choose a saved client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={loadClient} disabled={!selectedClientId}>
                Load client
              </button>
              <button type="button" className="secondary-button" onClick={deleteClient} disabled={!selectedClientId}>
                Delete client
              </button>
            </div>
            <div className="invoice-client-save">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={invoice.clientName || 'Client name for saved profile'}
              />
              <button type="button" className="secondary-button" onClick={saveClient}>
                <UserPlus size={15} aria-hidden="true" />
                Save client
              </button>
            </div>
          </div>
        </section>

        <section className="invoice-form-section">
          <div className="section-title-row">
            <h3>Line Items</h3>
            <div className="button-row" style={{ marginTop: 0 }}>
              <button
                type="button"
                className={`secondary-button${showLineLib ? ' is-active' : ''}`}
                onClick={() => setShowLineLib((v) => !v)}
              >
                <BookOpen size={15} aria-hidden="true" />
                Library{lineItemLib.length > 0 ? ` (${lineItemLib.length})` : ''}
              </button>
              <button type="button" className="secondary-button" onClick={addItem}>
                <Plus size={17} aria-hidden="true" />
                Add item
              </button>
            </div>
          </div>

          {showLineLib && (
            <div className="invoice-lib-panel">
              {lineItemLib.length === 0
                ? <p className="helper-text">No saved items yet. Click the bookmark icon on any line item to save it here.</p>
                : lineItemLib.map((entry) => (
                    <div key={entry.id} className="invoice-lib-entry">
                      <span className="invoice-lib-desc">{entry.description}</span>
                      <span className="invoice-lib-meta">{entry.quantity} × {entry.unitPrice}</span>
                      <button type="button" className="secondary-button" onClick={() => addLibItemToInvoice(entry)}>
                        <Plus size={13} aria-hidden="true" /> Add
                      </button>
                      <button type="button" className="icon-button" onClick={() => deleteLibItem(entry.id)} aria-label="Remove from library">
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  ))
              }
            </div>
          )}

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
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => saveItemToLib(item)}
                  aria-label="Save to line-item library"
                  title="Save to library"
                >
                  <BookOpen size={15} aria-hidden="true" />
                </button>
                <button type="button" className="icon-button danger" onClick={() => removeItem(item.id)} aria-label="Remove line item">
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`invoice-form-section${isLogoDragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsLogoDragging(true) }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsLogoDragging(false) }}
          onDrop={(e) => { e.preventDefault(); setIsLogoDragging(false); loadLogo(e.dataTransfer.files?.[0]) }}
        >
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
          <p className="helper-text">{message || 'Drafts, presets, and clients stay in localStorage on this browser only.'}</p>
        </section>
      </div>

      <aside className="invoice-preview" aria-label="Invoice preview">
        <div
          className={`invoice-paper invoice-layout-${invoice.layout}`}
          style={{
            '--invoice-accent': invoice.accentColor,
          }}
        >
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
