import { useState } from 'react'
import { Copy, Printer } from 'lucide-react'

const OPENINGS   = ['Dear', 'Hello', 'Hi', 'To Whom It May Concern,']
const CLOSINGS   = ['Sincerely', 'Best regards', 'Kind regards', 'Yours faithfully', 'Respectfully', 'Thank you']
const TEMPLATES  = [
  { label: 'Blank', body: '' },
  { label: 'Job Application', body: 'I am writing to express my interest in the [Position] role at [Company]. With my background in [Field], I believe I would be a strong addition to your team.\n\nThroughout my career, I have developed [Key Skill 1] and [Key Skill 2]. I am particularly excited about this opportunity because [Reason].\n\nI would welcome the chance to discuss how my experience aligns with your needs. Thank you for your time and consideration.' },
  { label: 'Complaint', body: 'I am writing to bring to your attention an issue I experienced on [Date] regarding [Issue Description].\n\nDespite [Previous Action Taken], the matter has not been resolved to a satisfactory standard. This has caused [Impact].\n\nI would appreciate a response within [Timeframe] outlining the steps you will take to resolve this matter. I look forward to your prompt attention.' },
  { label: 'Thank You', body: 'I wanted to take a moment to express my sincere gratitude for [Reason for Thanks].\n\nYour [Support / Guidance / Generosity] has made a significant difference. [Specific Impact or Result].\n\nI truly appreciate your time and effort, and I look forward to [Future Interaction].' },
  { label: 'Recommendation', body: 'It is my pleasure to recommend [Name] for [Position / Purpose]. I have known [Name] for [Duration] in my capacity as [Your Role].\n\nDuring this time, [Name] has consistently demonstrated [Key Quality 1] and [Key Quality 2]. A notable example was when [Specific Achievement].\n\nI have no hesitation in recommending [Name] and am confident they will be a valuable asset. Please feel free to contact me if you have any questions.' },
]

function today() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function LetterTemplateBuilder() {
  const [senderName,    setSenderName]    = useState('')
  const [senderTitle,   setSenderTitle]   = useState('')
  const [senderOrg,     setSenderOrg]     = useState('')
  const [senderAddr,    setSenderAddr]    = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientTitle,setRecipientTitle]= useState('')
  const [recipientOrg,  setRecipientOrg]  = useState('')
  const [recipientAddr, setRecipientAddr] = useState('')
  const [letterDate,    setLetterDate]    = useState(today)
  const [subject,       setSubject]       = useState('')
  const [opening,       setOpening]       = useState('Dear')
  const [body,          setBody]          = useState('')
  const [closing,       setClosing]       = useState('Sincerely')
  const [copied,        setCopied]        = useState(false)
  const [activeTab,     setActiveTab]     = useState('form')

  function applyTemplate(t) {
    setBody(t.body)
    setActiveTab('form')
  }

  const salutation = opening === 'To Whom It May Concern,' ? opening : `${opening}${recipientName ? ` ${recipientName}` : ''},`

  const plainText = [
    senderName,
    senderTitle,
    senderOrg,
    senderAddr,
    '',
    letterDate,
    '',
    recipientName,
    recipientTitle,
    recipientOrg,
    recipientAddr,
    '',
    subject ? `Re: ${subject}` : '',
    subject ? '' : null,
    salutation,
    '',
    body,
    '',
    `${closing},`,
    '',
    senderName,
    senderTitle,
  ].filter(l => l !== null).join('\n')

  function copyPlain() {
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const ICN = { display: 'inline', verticalAlign: 'middle', marginRight: 4 }

  return (
    <div className="tool-body letter-tool">
      <div className="letter-templates">
        {TEMPLATES.map(t => (
          <button
            key={t.label}
            type="button"
            className="secondary-button compact-button"
            onClick={() => applyTemplate(t)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="letter-columns">
        <div className="letter-form-col">
          <div className="letter-section-label">Sender</div>
          <div className="letter-fields-grid">
            {[
              [senderName, setSenderName, 'Full Name'],
              [senderTitle, setSenderTitle, 'Title / Role'],
              [senderOrg, setSenderOrg, 'Organisation'],
              [senderAddr, setSenderAddr, 'Address'],
            ].map(([val, setter, ph]) => (
              <div key={ph} className="field-group">
                <label className="field-label">{ph}</label>
                <input type="text" className="text-input" value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>

          <div className="letter-section-label" style={{ marginTop: 16 }}>Recipient</div>
          <div className="letter-fields-grid">
            {[
              [recipientName, setRecipientName, 'Full Name'],
              [recipientTitle, setRecipientTitle, 'Title / Role'],
              [recipientOrg, setRecipientOrg, 'Organisation'],
              [recipientAddr, setRecipientAddr, 'Address'],
            ].map(([val, setter, ph]) => (
              <div key={ph} className="field-group">
                <label className="field-label">{ph}</label>
                <input type="text" className="text-input" value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>

          <div className="letter-fields-grid" style={{ marginTop: 12 }}>
            <div className="field-group">
              <label className="field-label">Date</label>
              <input type="text" className="text-input" value={letterDate} onChange={e => setLetterDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Subject (optional)</label>
              <input type="text" className="text-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Re: …" />
            </div>
          </div>

          <div className="letter-fields-grid" style={{ marginTop: 12 }}>
            <div className="field-group">
              <label className="field-label">Opening</label>
              <select className="select-input" value={opening} onChange={e => setOpening(e.target.value)}>
                {OPENINGS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Closing</label>
              <select className="select-input" value={closing} onChange={e => setClosing(e.target.value)}>
                {CLOSINGS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="field-group" style={{ marginTop: 12 }}>
            <label className="field-label">Body</label>
            <textarea
              className="text-input"
              rows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your letter body here…"
            />
          </div>
        </div>

        <div className="letter-preview-col" id="letter-print-target">
          <div className="letter-preview">
            {(senderName || senderTitle || senderOrg || senderAddr) && (
              <div className="letter-preview-sender">
                {senderName  && <div><strong>{senderName}</strong></div>}
                {senderTitle && <div>{senderTitle}</div>}
                {senderOrg   && <div>{senderOrg}</div>}
                {senderAddr  && <div style={{ whiteSpace: 'pre-line' }}>{senderAddr}</div>}
              </div>
            )}

            <div className="letter-preview-date">{letterDate}</div>

            {(recipientName || recipientOrg) && (
              <div className="letter-preview-recipient">
                {recipientName  && <div><strong>{recipientName}</strong></div>}
                {recipientTitle && <div>{recipientTitle}</div>}
                {recipientOrg   && <div>{recipientOrg}</div>}
                {recipientAddr  && <div style={{ whiteSpace: 'pre-line' }}>{recipientAddr}</div>}
              </div>
            )}

            {subject && <div className="letter-preview-subject"><strong>Re:</strong> {subject}</div>}

            <div className="letter-preview-salutation">{salutation}</div>

            <div className="letter-preview-body">{body || <em style={{ opacity: 0.35 }}>Your letter body will appear here…</em>}</div>

            <div className="letter-preview-closing">
              <div>{closing},</div>
              <div style={{ marginTop: 32 }}>
                {senderName && <div><strong>{senderName}</strong></div>}
                {senderTitle && <div>{senderTitle}</div>}
              </div>
            </div>
          </div>

          <div className="letter-actions">
            <button type="button" className="secondary-button" onClick={copyPlain}>
              <Copy size={14} style={ICN} />{copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button type="button" className="primary-button" onClick={() => window.print()}>
              <Printer size={14} style={ICN} />Print / PDF
            </button>
          </div>
        </div>
      </div>

      <p className="helper-text">Choose a template to get started quickly. Use Print / PDF to save your letter.</p>
    </div>
  )
}
