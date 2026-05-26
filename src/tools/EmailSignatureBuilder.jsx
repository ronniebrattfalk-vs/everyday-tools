import { useMemo, useState } from 'react'
import { Clipboard } from 'lucide-react'
import DOMPurify from 'dompurify'

const DEFAULT_ACCENT = '#2563eb'

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : `https://${url}`
}

function buildHtml(fields, accent) {
  const { name, title, company, email, phone, website, linkedin, twitter, pronouns, location } = fields
  if (!name) return ''

  const accentColor = accent || DEFAULT_ACCENT
  const titleLine = [title, company].filter(Boolean).join(' · ')
  const websiteUrl = normalizeUrl(website)
  const linkedinUrl = linkedin
    ? (linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin.replace(/^\//, '')}`)
    : ''
  const twitterUrl = twitter
    ? `https://x.com/${twitter.replace(/^@/, '')}`
    : ''

  const contactItems = [
    email    && `<a href="mailto:${escHtml(email)}" style="color:${accentColor};text-decoration:none;">${escHtml(email)}</a>`,
    phone    && `<a href="tel:${escHtml(phone.replace(/\s/g, ''))}" style="color:${accentColor};text-decoration:none;">${escHtml(phone)}</a>`,
    websiteUrl && `<a href="${escHtml(websiteUrl)}" style="color:${accentColor};text-decoration:none;">${escHtml(website)}</a>`,
  ].filter(Boolean)

  const socialItems = [
    linkedinUrl && `<a href="${escHtml(linkedinUrl)}" style="color:${accentColor};text-decoration:none;">LinkedIn</a>`,
    twitterUrl  && `<a href="${escHtml(twitterUrl)}" style="color:${accentColor};text-decoration:none;">X / Twitter</a>`,
  ].filter(Boolean)

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#374151;">
  <tr>
    <td style="padding-bottom:6px;">
      <strong style="font-size:15px;color:#111827;display:block;">${escHtml(name)}${pronouns ? ` <span style="font-size:11px;color:#9ca3af;font-weight:normal;">(${escHtml(pronouns)})</span>` : ''}</strong>${titleLine ? `\n      <span style="color:#6b7280;">${escHtml(titleLine)}</span>` : ''}${location ? `\n      <span style="color:#9ca3af;font-size:12px;display:block;">${escHtml(location)}</span>` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding-top:8px;border-top:2px solid ${accentColor};">
      ${contactItems.length ? `<span style="display:block;margin-bottom:3px;">${contactItems.join(' · ')}</span>` : ''}${socialItems.length ? `<span style="display:block;font-size:12px;color:#6b7280;">${socialItems.join(' · ')}</span>` : ''}
    </td>
  </tr>
</table>`
}

function buildPlainText(fields) {
  const { name, title, company, email, phone, website, linkedin, twitter, pronouns, location } = fields
  if (!name) return ''
  const lines = [
    name + (pronouns ? ` (${pronouns})` : ''),
    [title, company].filter(Boolean).join(' · '),
    location,
    '',
    email    && `Email:    ${email}`,
    phone    && `Phone:    ${phone}`,
    website  && `Web:      ${normalizeUrl(website)}`,
    linkedin && `LinkedIn: ${linkedin.startsWith('http') ? linkedin : `linkedin.com/in/${linkedin.replace(/^\//, '')}`}`,
    twitter  && `X:        x.com/${twitter.replace(/^@/, '')}`,
  ].filter(s => s !== false && s !== undefined && s !== null)
  while (lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

export function EmailSignatureBuilder() {
  const [fields, setFields] = useState({
    name: '', title: '', company: '', email: '', phone: '',
    website: '', linkedin: '', twitter: '', pronouns: '', location: '',
  })
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [tab, setTab] = useState('html')
  const [message, setMessage] = useState('')

  function set(key, val) { setFields(f => ({ ...f, [key]: val })) }
  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 1500) }

  const html = useMemo(() => buildHtml(fields, accent), [fields, accent])
  const plainText = useMemo(() => buildPlainText(fields), [fields])

  async function copyHtml() {
    if (!html) return
    await navigator.clipboard.writeText(html)
    flash('HTML copied')
  }

  async function copyPlain() {
    if (!plainText) return
    await navigator.clipboard.writeText(plainText)
    flash('Plain text copied')
  }

  const previewHtml = html ? DOMPurify.sanitize(html) : ''

  return (
    <div className="tool-body sig-tool">
      <div className="sig-form">
        <div className="sig-fields-grid">
          {[
            ['name',     'Full Name',      'Jane Smith',             false],
            ['title',    'Job Title',      'Senior Engineer',        false],
            ['company',  'Company',        'Acme Corp',              false],
            ['email',    'Email',          'jane@acme.com',          false],
            ['phone',    'Phone',          '+1 555 123 4567',        false],
            ['website',  'Website',        'acme.com',               false],
            ['linkedin', 'LinkedIn',       'janesmith or full URL',  false],
            ['twitter',  'X / Twitter',   '@handle',                false],
            ['pronouns', 'Pronouns',       'she/her',                false],
            ['location', 'Location',       'New York, USA',          false],
          ].map(([key, label, placeholder]) => (
            <div key={key} className="field-group">
              <label className="field-label">{label}</label>
              <input
                type="text"
                className="text-input"
                value={fields[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        <div className="field-group sig-accent-row">
          <label className="field-label">Accent Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={accent}
              onChange={e => setAccent(e.target.value)}
              style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}
            />
            <input
              type="text"
              className="text-input"
              value={accent}
              onChange={e => setAccent(e.target.value)}
              style={{ width: 110 }}
              placeholder="#2563eb"
            />
          </div>
        </div>
      </div>

      <div className="sig-right">
        {previewHtml && (
          <div className="sig-preview">
            <div className="sig-preview-chrome">
              <div className="sig-preview-dots">
                <span /><span /><span />
              </div>
              <span className="sig-preview-label">Email preview</span>
            </div>
            <div className="sig-preview-body">
              <p className="sig-preview-body-text">Hi team,<br /><br />Thanks for your feedback — I'll follow up shortly.<br /><br />Best,</p>
              <hr className="sig-preview-divider" />
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        )}

        {fields.name && (
          <div className="sig-copy-panel">
            <div className="sig-tabs">
              <button type="button" className={`sig-tab${tab === 'html' ? ' active' : ''}`} onClick={() => setTab('html')}>HTML</button>
              <button type="button" className={`sig-tab${tab === 'plain' ? ' active' : ''}`} onClick={() => setTab('plain')}>Plain Text</button>
            </div>

            {tab === 'html' ? (
              <div className="sig-output-wrap">
                <pre className="code-output sig-output">{html}</pre>
                <button type="button" className="primary-button sig-copy-btn" onClick={copyHtml}>
                  <Clipboard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Copy HTML
                </button>
              </div>
            ) : (
              <div className="sig-output-wrap">
                <pre className="code-output sig-output">{plainText}</pre>
                <button type="button" className="primary-button sig-copy-btn" onClick={copyPlain}>
                  <Clipboard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Copy Plain Text
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="helper-text">{message || 'Fill in your details, then copy the HTML to paste into your email client signature settings.'}</p>
    </div>
  )
}
