import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const sampleNotes = `Discuss launch timeline
Decision: ship beta on Friday
Action: Maria to update help article
Action: Ben to prepare customer email
Risk: final legal review still pending
Follow up with sales team next week`

function categorizeLine(line) {
  const lower = line.toLowerCase()
  if (lower.startsWith('decision') || lower.includes('decided')) return 'decisions'
  if (lower.startsWith('action') || lower.includes(' to ')) return 'actions'
  if (lower.startsWith('risk') || lower.includes('blocked') || lower.includes('pending')) return 'risks'
  if (lower.includes('follow')) return 'followUps'
  return 'agenda'
}

function formatNotes(input) {
  const groups = { actions: [], agenda: [], decisions: [], followUps: [], risks: [] }
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => groups[categorizeLine(line)].push(line.replace(/^(Action|Decision|Risk):\s*/i, '')))

  return [
    '# Meeting Notes',
    '',
    '## Agenda',
    ...(groups.agenda.length ? groups.agenda.map((item) => `- ${item}`) : ['- No agenda items captured.']),
    '',
    '## Decisions',
    ...(groups.decisions.length ? groups.decisions.map((item) => `- ${item}`) : ['- No decisions captured.']),
    '',
    '## Actions',
    ...(groups.actions.length ? groups.actions.map((item) => `- [ ] ${item}`) : ['- [ ] No actions captured.']),
    '',
    '## Risks',
    ...(groups.risks.length ? groups.risks.map((item) => `- ${item}`) : ['- No risks captured.']),
    '',
    '## Follow-ups',
    ...(groups.followUps.length ? groups.followUps.map((item) => `- ${item}`) : ['- No follow-ups captured.']),
  ].join('\n')
}

function downloadText(value, filename) {
  const blob = new Blob([value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function MeetingNotesFormatter() {
  const [notes, setNotes] = useState(sampleNotes)
  const [message, setMessage] = useState('')
  const output = useMemo(() => formatNotes(notes), [notes])

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setMessage('Formatted notes copied')
  }

  function downloadOutput() {
    downloadText(output, 'meeting-notes.md')
    setMessage('Meeting notes downloaded')
  }

  function resetTool() {
    setNotes(sampleNotes)
    setMessage('Reset meeting notes formatter')
  }

  return (
    <div className="tool-body meeting-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Writing</p>
            <h3>Meeting notes formatter</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Rough notes
          <textarea className="headers-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyOutput}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        <p className="helper-text">{message || 'Turns rough notes into agenda, decisions, actions, risks, and follow-ups.'}</p>
      </section>

      <section className="checklist-output">
        <textarea className="code-area" value={output} readOnly spellCheck="false" />
      </section>
    </div>
  )
}
