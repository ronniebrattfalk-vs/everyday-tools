import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Plus, Trash2 } from 'lucide-react'
import Papa from 'papaparse'

const STORAGE_KEY = 'everyday-tools-budget'

const INCOME_CATS  = ['Salary', 'Freelance', 'Investment', 'Rental', 'Side Project', 'Other Income']
const EXPENSE_CATS = ['Housing', 'Food & Dining', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education', 'Subscriptions', 'Other']

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveAll(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}
function curMonth() { return new Date().toISOString().slice(0, 7) }
function shiftMonth(m, delta) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(m) {
  const [y, mo] = m.split('-')
  return new Date(+y, +mo - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
function usd(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const EMPTY_INCOME  = { category: INCOME_CATS[0],  description: '', amount: '' }
const EMPTY_EXPENSE = { category: EXPENSE_CATS[0], description: '', amount: '' }
const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 4 }

function BudgetPanel({ type, cats, form, setForm, list, total, colorClass, onAdd, onDelete }) {
  const label = type === 'income' ? 'Income' : 'Expenses'
  const reset = () => setForm(type === 'income' ? EMPTY_INCOME : EMPTY_EXPENSE)
  return (
    <div className="budget-panel">
      <div className={`budget-panel-header ${colorClass}`}>{label}</div>

      <div className="budget-add-row">
        <select
          className="select-input budget-add-cat"
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        >
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          type="text"
          className="text-input budget-add-desc"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onAdd(type, form, reset)}
          placeholder="Description"
        />
        <input
          type="number"
          className="text-input budget-add-amount"
          value={form.amount}
          min={0}
          step="0.01"
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onAdd(type, form, reset)}
          placeholder="0.00"
        />
        <button
          type="button"
          className="primary-button budget-add-btn"
          onClick={() => onAdd(type, form, reset)}
        >
          <Plus size={14} style={ICN} />Add
        </button>
      </div>

      <div className="budget-table-wrap">
        <table className="budget-table">
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="budget-empty">No entries yet.</td>
              </tr>
            )}
            {list.map(item => (
              <tr key={item.id}>
                <td className="budget-td-cat">{item.category}</td>
                <td className="budget-td-desc">{item.description || <span className="budget-desc-empty">—</span>}</td>
                <td className="budget-td-amount">{usd(item.amount)}</td>
                <td className="budget-td-del">
                  <button type="button" className="icon-button" onClick={() => onDelete(item.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {list.length > 0 && (
            <tfoot>
              <tr className="budget-total-row">
                <td colSpan={2}>Total {label}</td>
                <td className="budget-td-amount">{usd(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export function BudgetPlanner() {
  const [month, setMonth] = useState(curMonth)
  const [allData, setAllData] = useState(loadAll)
  const [incomeForm,  setIncomeForm]  = useState(EMPTY_INCOME)
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE)
  const [message, setMessage] = useState('')

  const items    = allData[month] ?? []
  const income   = useMemo(() => items.filter(i => i.type === 'income'),  [items])
  const expenses = useMemo(() => items.filter(i => i.type === 'expense'), [items])

  const totalIncome   = useMemo(() => income.reduce((s, i) => s + i.amount, 0),   [income])
  const totalExpenses = useMemo(() => expenses.reduce((s, i) => s + i.amount, 0), [expenses])
  const balance = totalIncome - totalExpenses

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  function addItem(type, form, resetForm) {
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { flash('Enter a valid amount.'); return }
    const entry = { id: Date.now(), type, category: form.category, description: form.description.trim(), amount }
    const updated = { ...allData, [month]: [...(allData[month] ?? []), entry] }
    setAllData(updated)
    saveAll(updated)
    resetForm()
  }

  function deleteItem(id) {
    const updated = { ...allData, [month]: (allData[month] ?? []).filter(i => i.id !== id) }
    setAllData(updated)
    saveAll(updated)
  }

  function exportCsv() {
    const rows = items.map(i => ({
      Month: month, Type: i.type, Category: i.category,
      Description: i.description, Amount: i.amount.toFixed(2),
    }))
    const blob = new Blob([Papa.unparse(rows)], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: `budget-${month}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="tool-body budget-tool">
      <div className="budget-topbar">
        <div className="budget-month-nav">
          <button type="button" className="icon-button" onClick={() => setMonth(m => shiftMonth(m, -1))}>
            <ChevronLeft size={18} />
          </button>
          <span className="budget-month-label">{monthLabel(month)}</span>
          <button type="button" className="icon-button" onClick={() => setMonth(m => shiftMonth(m, +1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        {items.length > 0 && (
          <button type="button" className="secondary-button" onClick={exportCsv}>
            <Download size={14} style={ICN} />Export CSV
          </button>
        )}
      </div>

      <div className="budget-summary-bar">
        <div className="budget-summary-item budget-income-item">
          <span>Income</span>
          <strong>{usd(totalIncome)}</strong>
        </div>
        <div className="budget-summary-divider">−</div>
        <div className="budget-summary-item budget-expense-item">
          <span>Expenses</span>
          <strong>{usd(totalExpenses)}</strong>
        </div>
        <div className="budget-summary-divider">=</div>
        <div className={`budget-summary-item budget-balance-item ${balance >= 0 ? 'positive' : 'negative'}`}>
          <span>Balance</span>
          <strong>{balance >= 0 ? '+' : ''}{usd(balance)}</strong>
        </div>
      </div>

      <div className="budget-columns">
        <BudgetPanel
          type="income"
          cats={INCOME_CATS}
          form={incomeForm}
          setForm={setIncomeForm}
          list={income}
          total={totalIncome}
          colorClass="budget-panel-header--income"
          onAdd={addItem}
          onDelete={deleteItem}
        />
        <BudgetPanel
          type="expense"
          cats={EXPENSE_CATS}
          form={expenseForm}
          setForm={setExpenseForm}
          list={expenses}
          total={totalExpenses}
          colorClass="budget-panel-header--expenses"
          onAdd={addItem}
          onDelete={deleteItem}
        />
      </div>

      <p className="helper-text">
        {message || 'Data is saved per month in your browser. Use the arrows to navigate between months.'}
      </p>
    </div>
  )
}
