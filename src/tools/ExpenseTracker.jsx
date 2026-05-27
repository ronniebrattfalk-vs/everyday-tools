import { useMemo, useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import Papa from 'papaparse'

const STORAGE_KEY = 'everyday-tools-expenses'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Housing', 'Shopping',
  'Entertainment', 'Health', 'Education', 'Travel', 'Utilities', 'Other',
]

const CATEGORY_COLORS = {
  'Food & Dining':  '#f59e0b',
  'Transport':      '#3b82f6',
  'Housing':        '#10b981',
  'Shopping':       '#ec4899',
  'Entertainment':  '#8b5cf6',
  'Health':         '#ef4444',
  'Education':      '#06b6d4',
  'Travel':         '#f97316',
  'Utilities':      '#6b7280',
  'Other':          '#9ca3af',
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveExpenses(expenses) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)) } catch { /* Ignore storage write errors. */ }
}

function today() { return new Date().toISOString().slice(0, 10) }

function usd(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function monthLabel(iso) {
  const [y, m] = iso.split('-')
  return new Date(+y, +m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState(loadExpenses)
  const [form, setForm] = useState({ date: today(), category: CATEGORIES[0], description: '', amount: '' })
  const [filterCat, setFilterCat] = useState('All')
  const [filterMonth, setFilterMonth] = useState('All')
  const [message, setMessage] = useState('')

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addExpense() {
    const amount = parseFloat(form.amount)
    if (!form.description.trim() || isNaN(amount) || amount <= 0) {
      flash('Enter a description and a valid amount.')
      return
    }
    const entry = { id: Date.now(), ...form, amount }
    const updated = [entry, ...expenses]
    setExpenses(updated)
    saveExpenses(updated)
    setForm(f => ({ ...f, description: '', amount: '' }))
  }

  function deleteExpense(id) {
    const updated = expenses.filter(e => e.id !== id)
    setExpenses(updated)
    saveExpenses(updated)
  }

  function clearAll() {
    if (!window.confirm('Delete all expenses? This cannot be undone.')) return
    setExpenses([])
    saveExpenses([])
  }

  const allMonths = useMemo(() => {
    const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse()
    return months
  }, [expenses])

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterCat !== 'All' && e.category !== filterCat) return false
      if (filterMonth !== 'All' && !e.date.startsWith(filterMonth)) return false
      return true
    })
  }, [expenses, filterCat, filterMonth])

  const totalFiltered = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered])

  const byCategory = useMemo(() => {
    const totals = {}
    expenses.forEach(e => {
      if (filterMonth !== 'All' && !e.date.startsWith(filterMonth)) return
      totals[e.category] = (totals[e.category] ?? 0) + e.amount
    })
    return Object.entries(totals).sort((a, b) => b[1] - a[1])
  }, [expenses, filterMonth])

  const grandTotal = useMemo(() => byCategory.reduce((s, [, v]) => s + v, 0), [byCategory])

  function exportCsv() {
    const csv = Papa.unparse(
      filtered.map(e => ({ Date: e.date, Category: e.category, Description: e.description, Amount: e.amount.toFixed(2) }))
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'expenses.csv' })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="tool-body expense-tool">
      <div className="expense-add-form">
        <div className="field-group expense-field-date">
          <label className="field-label">Date</label>
          <input type="date" className="text-input" value={form.date} onChange={e => setField('date', e.target.value)} />
        </div>
        <div className="field-group expense-field-cat">
          <label className="field-label">Category</label>
          <select className="select-input" value={form.category} onChange={e => setField('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field-group expense-field-desc">
          <label className="field-label">Description</label>
          <input
            type="text"
            className="text-input"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExpense()}
            placeholder="e.g. Lunch with team"
          />
        </div>
        <div className="field-group expense-field-amount">
          <label className="field-label">Amount ($)</label>
          <input
            type="number"
            className="text-input"
            value={form.amount}
            onChange={e => setField('amount', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExpense()}
            placeholder="0.00"
            min={0}
            step="0.01"
          />
        </div>
        <div className="expense-add-btn-wrap">
          <label className="field-label" style={{ visibility: 'hidden' }}>Add</label>
          <button type="button" className="primary-button expense-add-btn" onClick={addExpense}>
            <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Add
          </button>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="expense-layout">
          <div className="expense-sidebar">
            <div className="expense-summary-card">
              <div className="expense-summary-header">
                <span>By Category</span>
                <select className="select-input expense-month-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  <option value="All">All time</option>
                  {allMonths.map(m => <option key={m} value={m}>{monthLabel(m + '-01')}</option>)}
                </select>
              </div>
              {byCategory.map(([cat, total]) => (
                <div key={cat} className="expense-category-row">
                  <div className="expense-category-info">
                    <span className="expense-category-dot" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#888' }} />
                    <span className="expense-category-name">{cat}</span>
                  </div>
                  <div className="expense-category-bar-wrap">
                    <div
                      className="expense-category-bar"
                      style={{ width: `${(total / grandTotal) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] ?? '#888' }}
                    />
                  </div>
                  <span className="expense-category-amount">{usd(total)}</span>
                </div>
              ))}
              <div className="expense-total-row">
                <span>Total</span>
                <strong>{usd(grandTotal)}</strong>
              </div>
            </div>
          </div>

          <div className="expense-main">
            <div className="expense-filters">
              <select className="select-input" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">All categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="select-input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="All">All time</option>
                {allMonths.map(m => <option key={m} value={m}>{monthLabel(m + '-01')}</option>)}
              </select>
              <span className="expense-filter-total">
                {filtered.length} expenses · {usd(totalFiltered)}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button type="button" className="secondary-button" onClick={exportCsv}>
                  <Download size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />CSV
                </button>
                <button type="button" className="secondary-button" onClick={clearAll} style={{ color: 'var(--danger, #ef4444)' }}>
                  Clear All
                </button>
              </div>
            </div>

            <div className="expense-table-wrap">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="expense-empty">No expenses match the current filter.</td></tr>
                  )}
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td className="expense-td-date">{e.date}</td>
                      <td>
                        <span className="expense-cat-badge" style={{ '--cat-color': CATEGORY_COLORS[e.category] ?? '#888' }}>
                          {e.category}
                        </span>
                      </td>
                      <td className="expense-td-desc">{e.description}</td>
                      <td className="expense-td-amount">{usd(e.amount)}</td>
                      <td>
                        <button type="button" className="icon-button" onClick={() => deleteExpense(e.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <p className="expense-empty-state">No expenses yet. Add your first one above.</p>
      )}

      <p className="helper-text">{message || 'Expenses are saved in your browser — no account needed.'}</p>
    </div>
  )
}
