import { useMemo, useState } from 'react'
import { Clipboard, Plus, Trash2 } from 'lucide-react'

function uid() { return Math.random().toString(36).slice(2) }

const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 6 }

export function DecisionMatrix() {
  const [options, setOptions] = useState(() => [
    { id: uid(), name: 'Option A' },
    { id: uid(), name: 'Option B' },
    { id: uid(), name: 'Option C' },
  ])
  const [criteria, setCriteria] = useState(() => [
    { id: uid(), name: 'Cost',        weight: 4 },
    { id: uid(), name: 'Quality',     weight: 5 },
    { id: uid(), name: 'Ease of use', weight: 3 },
    { id: uid(), name: 'Speed',       weight: 2 },
  ])
  const [scores, setScores] = useState({})
  const [message, setMessage] = useState('')

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  function score(cId, oId) { return scores[`${cId}-${oId}`] ?? 5 }
  function setScore(cId, oId, val) {
    const n = Math.min(10, Math.max(1, Math.round(+val) || 1))
    setScores(s => ({ ...s, [`${cId}-${oId}`]: n }))
  }

  function updateOption(id, name) { setOptions(os => os.map(o => o.id === id ? { ...o, name } : o)) }
  function removeOption(id) { setOptions(os => os.filter(o => o.id !== id)) }
  function addOption() {
    setOptions(os => [...os, { id: uid(), name: `Option ${String.fromCharCode(65 + os.length)}` }])
  }

  function updateCriterion(id, key, val) { setCriteria(cs => cs.map(c => c.id === id ? { ...c, [key]: val } : c)) }
  function removeCriterion(id) { setCriteria(cs => cs.filter(c => c.id !== id)) }
  function addCriterion() { setCriteria(cs => [...cs, { id: uid(), name: 'New criterion', weight: 3 }]) }

  const totals = useMemo(() => {
    const totalWeight = criteria.reduce((s, c) => s + c.weight, 0)
    if (!totalWeight) return options.map(() => 0)
    return options.map(o =>
      criteria.reduce((s, c) => s + (scores[`${c.id}-${o.id}`] ?? 5) * c.weight, 0) / totalWeight
    )
  }, [options, criteria, scores])

  const bestIdx = useMemo(() => {
    const max = Math.max(...totals)
    return totals.indexOf(max)
  }, [totals])

  const ranks = useMemo(() => {
    const sorted = [...totals].sort((a, b) => b - a)
    return totals.map(t => sorted.indexOf(t) + 1)
  }, [totals])

  async function copySummary() {
    const lines = [
      'Decision Matrix Summary',
      '',
      'Ranking:',
      ...options
        .map((o, i) => ({ name: o.name, total: totals[i], rank: ranks[i] }))
        .sort((a, b) => a.rank - b.rank)
        .map(({ name, total, rank }) => `  #${rank}  ${name || `Option ${rank}`}  —  ${total.toFixed(2)}/10`),
      '',
      'Criteria weights:',
      ...criteria.map(c => `  ${c.name || 'Unnamed'}: weight ${c.weight}`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    flash('Copied')
  }

  const showAdd = options.length < 8

  return (
    <div className="tool-body dm-tool">
      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead>
            <tr>
              <th className="dm-th-label">Criterion · Weight</th>
              {options.map((o, i) => (
                <th key={o.id} className={`dm-th-option${i === bestIdx ? ' dm-winner' : ''}`}>
                  <div className="dm-option-cell">
                    <input
                      className="dm-name-input"
                      value={o.name}
                      onChange={e => updateOption(o.id, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                    />
                    {options.length > 2 && (
                      <button type="button" className="icon-button" onClick={() => removeOption(o.id)} title="Remove">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {showAdd && (
                <th className="dm-th-add">
                  <button type="button" className="icon-button" onClick={addOption} title="Add option">
                    <Plus size={14} />
                  </button>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {criteria.map(c => (
              <tr key={c.id}>
                <td className="dm-td-label">
                  <input
                    className="dm-name-input dm-criterion-name"
                    value={c.name}
                    onChange={e => updateCriterion(c.id, 'name', e.target.value)}
                    placeholder="Criterion"
                  />
                  <div className="dm-weight-row">
                    <span className="dm-weight-tag">w</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={c.weight}
                      onChange={e => updateCriterion(c.id, 'weight', +e.target.value)}
                      className="dm-weight-slider"
                    />
                    <span className="dm-weight-val">{c.weight}</span>
                    {criteria.length > 1 && (
                      <button type="button" className="icon-button" onClick={() => removeCriterion(c.id)} title="Remove">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </td>
                {options.map((o, i) => (
                  <td key={o.id} className={`dm-td-score${i === bestIdx ? ' dm-winner' : ''}`}>
                    <input
                      type="number"
                      className="dm-score-input"
                      min={1}
                      max={10}
                      value={score(c.id, o.id)}
                      onChange={e => setScore(c.id, o.id, e.target.value)}
                    />
                  </td>
                ))}
                {showAdd && <td className="dm-td-add" />}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className="dm-td-label">
                <button type="button" className="secondary-button dm-add-criterion-btn" onClick={addCriterion}>
                  <Plus size={12} style={ICN} />Add criterion
                </button>
              </td>
              {options.map((o, i) => (
                <td key={o.id} className={`dm-td-total${i === bestIdx ? ' dm-winner' : ''}`}>
                  <div className="dm-total-val">{totals[i].toFixed(2)}</div>
                  <div className="dm-rank-tag">#{ranks[i]}</div>
                </td>
              ))}
              {showAdd && <td className="dm-td-add" />}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="dm-result-bar">
        <span className="dm-result-label">Best option:</span>
        <span className="dm-result-winner-name">{options[bestIdx]?.name || `Option ${bestIdx + 1}`}</span>
        <span className="dm-result-score">{totals[bestIdx]?.toFixed(2)}/10</span>
        <button type="button" className="secondary-button" style={{ marginLeft: 'auto' }} onClick={copySummary}>
          <Clipboard size={14} style={ICN} />Copy Summary
        </button>
      </div>

      <p className="helper-text">
        {message || 'Score each option 1–10 per criterion. Drag the weight slider to reflect importance.'}
      </p>
    </div>
  )
}
