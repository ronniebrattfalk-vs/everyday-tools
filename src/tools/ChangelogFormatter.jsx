import { useMemo, useState } from 'react'
import { Clipboard, Download } from 'lucide-react'

const SECTIONS = ['Added', 'Changed', 'Fixed', 'Removed', 'Deprecated', 'Security']

const KEYWORDS = {
  Added:      /\b(add|new|creat|introduc|implement|support|feat|initial|launch|enabl)\w*/i,
  Changed:    /\b(chang|updat|improv|enhanc|refactor|renam|migrat|upgrad|conver|bump|rebrand|replac|switch|rewrit|reorg)\w*/i,
  Fixed:      /\b(fix|bug|patch|resolv|correct|repair|address|revert|hotfix|workaround)\w*/i,
  Removed:    /\b(remov|delet|drop|clean|purg|strip|elimin)\w*/i,
  Deprecated: /\b(deprecat|obsolet|legacy|sunset|phase.?out)\w*/i,
  Security:   /\b(security|vuln|cve|auth|xss|injection|csrf|sanitiz|escape|exploit)\w*/i,
}

function classify(text) {
  for (const [section, re] of Object.entries(KEYWORDS)) {
    if (re.test(text)) return section
  }
  return 'Changed'
}

function buildMarkdown(items, version, date) {
  const header = `## [${version || 'Unreleased'}]${date ? ` - ${date}` : ''}`
  const grouped = Object.fromEntries(SECTIONS.map(s => [s, []]))
  items.forEach(item => { grouped[item.section]?.push(item.text) })

  const body = SECTIONS.flatMap(section => {
    const entries = grouped[section]
    if (!entries.length) return []
    return [`### ${section}`, ...entries.map(t => `- ${t}`), '']
  })

  return [header, '', ...body].join('\n').trimEnd()
}

const SECTION_COLORS = {
  Added: '#10b981',
  Changed: '#3b82f6',
  Fixed: '#f59e0b',
  Removed: '#ef4444',
  Deprecated: '#8b5cf6',
  Security: '#ec4899',
}

export function ChangelogFormatter() {
  const [raw, setRaw] = useState('')
  const [version, setVersion] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [overrides, setOverrides] = useState({})
  const [message, setMessage] = useState('')

  const items = useMemo(() =>
    raw.split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((line, i) => {
        const text = line.replace(/^[-*•·#\d.)\]]+\s*/, '').trim()
        return { id: i, raw: line, text, section: overrides[text] ?? classify(text) }
      }),
    [raw, overrides]
  )

  const output = useMemo(() => buildMarkdown(items, version, date), [items, version, date])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }
  function moveItem(text, section) { setOverrides(o => ({ ...o, [text]: section })) }

  async function copy() {
    if (!items.length) return
    await navigator.clipboard.writeText(output)
    flash('Copied')
  }

  function download() {
    if (!items.length) return
    const blob = new Blob([output], { type: 'text/markdown' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `CHANGELOG-${version || 'unreleased'}.md`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const grouped = Object.fromEntries(SECTIONS.map(s => [s, []]))
  items.forEach(item => { grouped[item.section]?.push(item) })
  const hasItems = items.length > 0

  const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 6 }

  return (
    <div className="tool-body changelog-tool">
      <div className="changelog-header-row">
        <div className="field-group">
          <label className="field-label">Version</label>
          <input
            type="text"
            className="text-input"
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="1.2.0"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Date</label>
          <input
            type="date"
            className="text-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Raw Changelog Bullets</label>
        <textarea
          className="code-textarea"
          rows={8}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder={[
            '- Added dark mode support',
            '- Fixed login redirect bug',
            '- Updated React to 19.0',
            '- Removed legacy API endpoints',
            '- Security patch for auth tokens',
          ].join('\n')}
          spellCheck={false}
        />
      </div>

      {hasItems && (
        <div className="changelog-sections">
          {SECTIONS.map(section => {
            const sectionItems = grouped[section]
            if (!sectionItems.length) return null
            return (
              <div
                key={section}
                className="changelog-section"
                style={{ '--section-color': SECTION_COLORS[section] }}
              >
                <div className="changelog-section-title">
                  {section}
                  <span className="changelog-badge">{sectionItems.length}</span>
                </div>
                {sectionItems.map(item => (
                  <div key={item.id} className="changelog-item">
                    <span className="changelog-item-text">{item.text}</span>
                    <div className="changelog-move-row">
                      {SECTIONS.filter(s => s !== section).map(s => (
                        <button
                          key={s}
                          type="button"
                          className="changelog-move-btn"
                          style={{ '--btn-color': SECTION_COLORS[s] }}
                          onClick={() => moveItem(item.text, s)}
                          title={`Move to ${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {hasItems && (
        <div className="field-group">
          <div className="section-title-row">
            <span className="field-label">Markdown Output</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="secondary-button" onClick={copy}>
                <Clipboard size={14} style={ICN} />Copy
              </button>
              <button type="button" className="secondary-button" onClick={download}>
                <Download size={14} style={ICN} />Download .md
              </button>
            </div>
          </div>
          <pre className="code-output">{output}</pre>
        </div>
      )}

      <p className="helper-text">
        {message || 'Items are auto-classified by keyword. Click a section name to move an item.'}
      </p>
    </div>
  )
}
