import { useState } from 'react'
import { AlertCircle, CheckCircle, Copy, Info } from 'lucide-react'

const SPEC = {
  'as2-version':                    { required: true,  desc: 'Protocol version. Must be "1.2" for OFTP2-compatible AS2 partners. Older implementations may use "1.0" or "1.1".' },
  'as2-from':                       { required: true,  desc: 'Sender AS2 identifier. Must exactly match the agreed partner ID (case-sensitive in most implementations).' },
  'as2-to':                         { required: true,  desc: 'Receiver AS2 identifier. Must exactly match the agreed partner ID.' },
  'message-id':                     { required: true,  desc: 'Unique message identifier. Should be globally unique — typically formatted as <UUID@hostname>. Used to correlate the MDN with the original message.' },
  'content-type':                   { required: true,  desc: 'MIME type of the payload. Common: application/edi-x12, application/edifact, application/octet-stream. Signed messages use multipart/signed; encrypted use application/pkcs7-mime with smime-type=enveloped-data.' },
  'mime-version':                   { required: false, desc: 'Should be "1.0". Required when the body is a MIME multipart message (signed or encrypted).' },
  'content-length':                 { required: false, desc: 'Byte length of the message body. Required by many AS2 servers to pre-allocate buffers.' },
  'content-transfer-encoding':      { required: false, desc: 'Transfer encoding applied to the body. Common values: binary (preferred), base64, 7bit, 8bit.' },
  'content-disposition':            { required: false, desc: 'Attachment filename hint. E.g. attachment; filename="document.edi". Helps the receiver identify the payload filename.' },
  'subject':                        { required: false, desc: 'Optional human-readable description of the transfer. Not processed by the AS2 engine but useful for operator logs.' },
  'date':                           { required: false, desc: 'Message creation timestamp in RFC 2822 format. Used for replay-attack detection on strict servers.' },
  'disposition-notification-to':    { required: false, desc: 'Signals that the sender wants an MDN receipt. Value is the sender\'s MDN return address (email or HTTP URL). Absence means no MDN is requested.' },
  'disposition-notification-options': { required: false, desc: 'Requested MDN signing parameters. Example: signed-receipt-protocol=optional,pkcs7-signature; signed-receipt-micalg=optional,sha-256. "optional" means signed MDN is preferred but unsigned is accepted; "required" means the MDN must be signed.' },
  'receipt-delivery-option':        { required: false, desc: 'URL for asynchronous MDN delivery. When present, the receiver sends the MDN to this URL out-of-band (async MDN). The synchronous HTTP response will be a plain 200 OK with no MDN body.' },
  'server':                         { required: false, desc: 'Sender HTTP server identifier. Useful for diagnosing interoperability issues between different AS2 products.' },
  'user-agent':                     { required: false, desc: 'Sender client software identifier. Same diagnostic purpose as the Server header.' },
  'etag':                           { required: false, desc: 'Entity tag for the message. Rarely used in AS2 but present in some implementations.' },
}

const REQUIRED = Object.entries(SPEC).filter(([, v]) => v.required).map(([k]) => k)

function parseHeaders(raw) {
  const result = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([^:\s][^:]*?)\s*:\s*(.*)$/)
    if (m) result[m[1].trim().toLowerCase()] = m[2].trim()
  }
  return result
}

function mdnType(h) {
  if (h['receipt-delivery-option']) return { label: 'Async MDN', detail: `MDN will be POSTed to: ${h['receipt-delivery-option']}`, ok: true }
  if (h['disposition-notification-to']) return { label: 'Sync MDN', detail: `MDN returned in HTTP response to: ${h['disposition-notification-to']}`, ok: true }
  return { label: 'No MDN', detail: 'Disposition-Notification-To is absent — no receipt will be sent.', ok: false }
}

function signingStatus(h) {
  const ct = h['content-type'] || ''
  if (ct.includes('multipart/signed') || ct.includes('smime-type=signed-data')) return { label: 'Signed', ok: true }
  if (ct.includes('smime-type=enveloped-data') && ct.includes('signed')) return { label: 'Signed + Encrypted', ok: true }
  return { label: 'Not signed', ok: false }
}

function encryptionStatus(h) {
  const ct = h['content-type'] || ''
  if (ct.includes('smime-type=enveloped-data') || ct.includes('application/pkcs7-mime')) return { label: 'Encrypted', ok: true }
  return { label: 'Not encrypted', ok: false }
}

export function AS2HeaderInspector() {
  const [raw, setRaw] = useState('')
  const [copied, setCopied] = useState(false)

  const headers = raw.trim() ? parseHeaders(raw) : null
  const knownRows = headers
    ? Object.entries(SPEC).map(([name, meta]) => ({ name, meta, value: headers[name] ?? null }))
    : []
  const unknownKeys = headers ? Object.keys(headers).filter((k) => !SPEC[k]) : []
  const missingRequired = knownRows.filter((r) => r.meta.required && !r.value)
  const presentRows = knownRows.filter((r) => r.value)

  const mdn = headers ? mdnType(headers) : null
  const signing = headers ? signingStatus(headers) : null
  const encryption = headers ? encryptionStatus(headers) : null

  function copy() {
    if (!headers) return
    const lines = [
      'AS2 Header Analysis',
      `MDN: ${mdn.label} — ${mdn.detail}`,
      `Signing: ${signing.label}`,
      `Encryption: ${encryption.label}`,
      '',
      `Present (${presentRows.length}):`,
      ...presentRows.map((r) => `  ${r.name}: ${r.value}`),
      '',
      missingRequired.length
        ? `Missing required (${missingRequired.length}): ${missingRequired.map((r) => r.name).join(', ')}`
        : 'All required headers present.',
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="tool-body">
      <div className="proto-tool">
        <div className="proto-input-panel">
          <label>
            Paste AS2 HTTP headers
            <textarea
              className="proto-textarea"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={
                'AS2-Version: 1.2\n' +
                'AS2-From: SENDER_ID\n' +
                'AS2-To: RECEIVER_ID\n' +
                'Message-ID: <uuid@host>\n' +
                'Content-Type: application/edi-x12\n' +
                'Disposition-Notification-To: https://sender.example.com/as2/mdn\n' +
                'Disposition-Notification-Options: signed-receipt-protocol=optional,pkcs7-signature; signed-receipt-micalg=optional,sha-256'
              }
              spellCheck={false}
            />
          </label>
        </div>

        <div className="proto-results-panel">
          {!headers && (
            <div className="proto-empty">
              <p>Paste AS2 HTTP headers — from a request log, Wireshark capture, or your AS2 server config — to inspect them field by field.</p>
              <p>Everything runs locally. Nothing is sent anywhere.</p>
            </div>
          )}

          {headers && (
            <>
              <div className="proto-summary">
                <div className={`proto-badge ${mdn.ok ? 'proto-badge--ok' : 'proto-badge--warn'}`}>{mdn.label}</div>
                <div className={`proto-badge ${signing.ok ? 'proto-badge--ok' : ''}`}>{signing.label}</div>
                <div className={`proto-badge ${encryption.ok ? 'proto-badge--ok' : ''}`}>{encryption.label}</div>
                <button type="button" className="secondary-button" onClick={copy}>
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy summary'}
                </button>
              </div>

              {mdn.ok && (
                <div className="proto-info-row">
                  <Info size={13} />
                  <span>{mdn.detail}</span>
                </div>
              )}

              {missingRequired.length > 0 && (
                <div className="proto-alert">
                  <AlertCircle size={14} />
                  <span>
                    Missing {missingRequired.length} required header{missingRequired.length > 1 ? 's' : ''}:{' '}
                    {missingRequired.map((r) => r.name).join(', ')}
                  </span>
                </div>
              )}

              {missingRequired.length === 0 && (
                <div className="proto-ok-row">
                  <CheckCircle size={13} />
                  <span>All {REQUIRED.length} required headers present.</span>
                </div>
              )}

              <div className="proto-field-list">
                {presentRows.map((r) => (
                  <div key={r.name} className="proto-field-row">
                    <div className="proto-field-name">{r.name}</div>
                    <div className="proto-field-value">{r.value}</div>
                    <div className="proto-field-desc">{r.meta.desc}</div>
                  </div>
                ))}
                {missingRequired.map((r) => (
                  <div key={r.name} className="proto-field-row proto-field-row--missing">
                    <div className="proto-field-name">
                      {r.name}
                      <span className="proto-required-tag">required</span>
                    </div>
                    <div className="proto-field-value proto-field-missing">— not present —</div>
                    <div className="proto-field-desc">{r.meta.desc}</div>
                  </div>
                ))}
                {unknownKeys.length > 0 && (
                  <div className="proto-field-row proto-field-row--other">
                    <div className="proto-field-name" style={{ gridColumn: '1 / -1' }}>
                      <Info size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                      Other headers: {unknownKeys.map((k) => `${k}: ${headers[k]}`).join(' · ')}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
