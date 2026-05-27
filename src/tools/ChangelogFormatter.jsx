import { useMemo, useState } from 'react'
import LinkifyIt from 'linkify-it'
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

const linkify = new LinkifyIt()

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

function buildLinkedParts(line, repoUrl) {
  const segments = []

  const urlMatches = linkify.match(line) || []
  urlMatches.forEach(m => segments.push({ start: m.index, end: m.lastIndex, href: m.url, label: m.text }))

  if (repoUrl) {
    const base = repoUrl.replace(/\/$/, '')
    const issueRe = /#(\d+)/g
    let m
    while ((m = issueRe.exec(line)) !== null) {
      segments.push({ start: m.index, end: m.index + m[0].length, href: `${base}/issues/${m[1]}`, label: m[0] })
    }
    const commitRe = /\b([0-9a-f]{7,12})\b/g
    while ((m = commitRe.exec(line)) !== null) {
      segments.push({ start: m.index, end: m.index + m[0].length, href: `${base}/commit/${m[1]}`, label: m[0] })
    }
  }

  segments.sort((a, b) => a.start - b.start)
  const deduped = []
  let cursor = 0
  for (const seg of segments) {
    if (seg.start >= cursor) {
      deduped.push(seg)
      cursor = seg.end
    }
  }

  const parts = []
  let pos = 0
  deduped.forEach((seg, i) => {
    if (seg.start > pos) parts.push(line.slice(pos, seg.start))
    parts.push(
      <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className="changelog-link">
        {seg.label}
      </a>,
    )
    pos = seg.end
  })
  if (pos < line.length) parts.push(line.slice(pos))
  return parts
}

function renderPreview(markdown, repoUrl) {
  return markdown.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <div key={i} className="changelog-preview-h2">{buildLinkedParts(line, repoUrl)}</div>
    }
    if (line.startsWith('### ')) {
      return <div key={i} className="changelog-preview-h3">{buildLinkedParts(line, repoUrl)}</div>
    }
    if (line.startsWith('- ')) {
      return <div key={i} className="changelog-preview-item">{buildLinkedParts(line, repoUrl)}</div>
    }
    if (!line.trim()) {
      return <div key={i} className="changelog-preview-gap" />
    }
    return <div key={i}>{buildLinkedParts(line, repoUrl)}</div>
  })
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
  const [repoUrl, setRepoUrl] = useState('')
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
        <div className="field-group">
          <label className="field-label">
            Repo URL
            <span className="field-label-hint"> — optional, enables #issue and commit links</span>
          </label>
          <input
            type="url"
            className="text-input"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
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
            '- Fixed login redirect bug #42',
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
            <span className="field-label">Preview</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="secondary-button" onClick={copy}>
                <Clipboard size={14} style={ICN} />Copy markdown
              </button>
              <button type="button" className="secondary-button" onClick={download}>
                <Download size={14} style={ICN} />Download .md
              </button>
            </div>
          </div>
          <div className="changelog-preview">
            {renderPreview(output, repoUrl)}
          </div>
        </div>
      )}

      <p className="helper-text">
        {message || 'Items are auto-classified by keyword. Click a section name to move an item.'}
      </p>
    </div>
  )
}
