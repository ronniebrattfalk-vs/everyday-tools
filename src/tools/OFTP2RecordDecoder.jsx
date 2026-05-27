import { useState } from 'react'
import { Copy, CheckCircle } from 'lucide-react'

// RFC 5024 command definitions: leading byte → structure
const COMMANDS = {
  O: {
    name: 'SSRM — Start Session Ready Message',
    desc: 'Sent by the Initiator immediately after the TCP connection is established. Contains the ODETTE-FTP protocol level string.',
    fields: [
      { name: 'Command',              start: 0,  len: 1,  desc: 'Fixed: "O"' },
      { name: 'Protocol Level',       start: 1,  len: 14, desc: 'Must be exactly "ODETTE-FTP-2.0" for an OFTP2 session. Older sessions use "ODETTE-FTP-V1.3" or "ODETTE-FTP-V1.4".' },
      { name: 'Auth Challenge',       start: 15, len: 8,  desc: 'Random 8-byte challenge used for session-level mutual authentication (OFTP2 extension). Padded with spaces if authentication is not used.' },
    ],
  },
  X: {
    name: 'SSID — Start Session',
    desc: 'Response to SSRM from the Responder. Declares the session SFID, password, capability flags, and buffer parameters.',
    fields: [
      { name: 'Command',              start: 0,  len: 1,  desc: 'Fixed: "X"' },
      { name: 'SFID',                 start: 1,  len: 25, desc: 'Session File Identifier — the OFTP2 partner ID for this session. Space-padded to 25 characters. Must match the agreed OFTP2 ID.' },
      { name: 'Password',             start: 26, len: 8,  desc: 'Session password, space-padded to 8 characters. Blank if no password is configured.' },
      { name: 'Data Buffer Size',     start: 34, len: 5,  desc: 'Maximum data buffer size in bytes (00064–99999). A larger value improves throughput for large file transfers.' },
      { name: 'Compression',          start: 39, len: 1,  desc: '"Y" = buffer-level compression supported; "N" = not supported.' },
      { name: 'Restart',              start: 40, len: 1,  desc: '"Y" = checkpoint/restart recovery supported; "N" = not supported.' },
      { name: 'Special Logic',        start: 41, len: 1,  desc: '"Y" = special logic (AURP/V.42bis) supported; "N" = not supported.' },
      { name: 'Credit Count',         start: 42, len: 3,  desc: 'Initial credit: number of DATA records the receiver will accept before requiring a CDT (Change Direction) acknowledgment. Range 000–999.' },
      { name: 'Secure Auth',          start: 45, len: 1,  desc: '"Y" = session-level mutual authentication (signed challenge/response) required; "N" = not required.' },
      { name: 'User Data',            start: 46, len: 8,  desc: 'Free-form user-defined field, space-padded. May carry version strings or implementation identifiers.' },
    ],
  },
  H: {
    name: 'SFID — Start File',
    desc: 'Begins a file transfer. Carries the virtual filename, dataset name, originator/destination IDs, timestamps, format, size, and security attributes.',
    fields: [
      { name: 'Command',              start: 0,   len: 1,  desc: 'Fixed: "H"' },
      { name: 'Virtual Filename',     start: 1,   len: 26, desc: 'OFTP2 virtual filename — the logical identifier agreed with the trading partner. Uniquely identifies this file in the EERP/NERP acknowledgment.' },
      { name: 'Dataset Name',         start: 27,  len: 26, desc: 'Physical or logical name of the file or dataset being transferred. Space-padded.' },
      { name: 'UTC Date',             start: 53,  len: 8,  desc: 'File creation date in UTC — format YYYYMMDD.' },
      { name: 'UTC Time',             start: 61,  len: 6,  desc: 'File creation time in UTC — format HHMMSS.' },
      { name: 'UTC Time Offset',      start: 67,  len: 4,  desc: 'Signed UTC offset of the originator (e.g. +0100 or -0500). Used for display purposes only.' },
      { name: 'Originator',           start: 71,  len: 25, desc: 'OFTP2 SFID of the file originator. May differ from the sending partner in relay or hub-and-spoke scenarios.' },
      { name: 'Destination',          start: 96,  len: 25, desc: 'OFTP2 SFID of the final file destination.' },
      { name: 'Record Format',        start: 121, len: 1,  desc: '"F" = Fixed-length records; "V" = Variable-length records; "U" = Unstructured (binary/stream). Most modern EDI and binary transfers use "U".' },
      { name: 'Max Record Size',      start: 122, len: 5,  desc: 'Maximum record length in bytes. "00000" for unstructured (U) format.' },
      { name: 'File Size (KB)',        start: 127, len: 13, desc: 'Estimated file size in 1024-byte units. Used for progress indication. May be approximate.' },
      { name: 'File Size (Bytes)',     start: 140, len: 13, desc: 'Exact file size in bytes (OFTP2 extension). Takes precedence over the KB estimate when non-zero.' },
      { name: 'Restart Offset',       start: 153, len: 17, desc: 'Byte offset for checkpoint/restart resume. All zeros for a fresh transfer.' },
      { name: 'Security Level',       start: 170, len: 2,  desc: '"00" = no security; "01" = signed; "02" = encrypted; "03" = signed and encrypted.' },
      { name: 'Cipher Suite',         start: 172, len: 4,  desc: 'Negotiated cipher suite code. "0000" if no security. Defined values in RFC 5024 §13.' },
      { name: 'Compressed',           start: 176, len: 1,  desc: '"Y" = payload is compressed (zlib); "N" = not compressed.' },
      { name: 'Enveloped',            start: 177, len: 1,  desc: '"F" = file is wrapped in a full S/MIME envelope; "N" = not enveloped (plain signed/encrypted).' },
      { name: 'Signed Receipt',       start: 178, len: 1,  desc: '"Y" = the sender requires a signed EERP acknowledgment; "N" = unsigned EERP is acceptable.' },
      { name: 'Description',          start: 179, len: 35, desc: 'Human-readable file description. Space-padded.' },
    ],
  },
  T: {
    name: 'EFID — End File',
    desc: 'Sent by the receiver to confirm all file data was received. Triggers the EERP/NERP exchange.',
    fields: [
      { name: 'Command',              start: 0,  len: 1,  desc: 'Fixed: "T"' },
      { name: 'Record Count',         start: 1,  len: 17, desc: 'Number of payload octets (or credit units) received. The sender verifies this against the sent byte count to detect truncation.' },
      { name: 'Checksum',             start: 18, len: 32, desc: 'MD5 checksum of the received payload, hex-encoded, when checksum verification was negotiated. All spaces if not used.' },
    ],
  },
  E: {
    name: 'EERP — End to End Response',
    desc: 'Positive end-to-end acknowledgment. Confirms the file reached its final destination and was accepted. May be signed.',
    fields: [
      { name: 'Command',              start: 0,  len: 1,  desc: 'Fixed: "E"' },
      { name: 'Virtual Filename',     start: 1,  len: 26, desc: 'Must exactly match the SFID virtual filename.' },
      { name: 'Dataset Name',         start: 27, len: 26, desc: 'Must exactly match the SFID dataset name.' },
      { name: 'UTC Date',             start: 53, len: 8,  desc: 'Must match the SFID UTC date.' },
      { name: 'UTC Time',             start: 61, len: 6,  desc: 'Must match the SFID UTC time.' },
      { name: 'Originator',           start: 67, len: 25, desc: 'Must match the SFID originator SFID.' },
      { name: 'Destination',          start: 92, len: 25, desc: 'Must match the SFID destination SFID.' },
      { name: 'Signature',            start: 117,         desc: 'CMS/PKCS#7 detached signature over the EERP fields, base64-encoded. Present only when the sender required a signed EERP (SFID Signed Receipt = "Y").' },
    ],
  },
  N: {
    name: 'NERP — Negative End Response',
    desc: 'Negative end-to-end acknowledgment. The file was received but rejected or could not be delivered to its final destination.',
    fields: [
      { name: 'Command',              start: 0,   len: 1,  desc: 'Fixed: "N"' },
      { name: 'Virtual Filename',     start: 1,   len: 26, desc: 'Must match the SFID virtual filename.' },
      { name: 'Dataset Name',         start: 27,  len: 26, desc: 'Must match the SFID dataset name.' },
      { name: 'UTC Date',             start: 53,  len: 8,  desc: 'Must match the SFID UTC date.' },
      { name: 'UTC Time',             start: 61,  len: 6,  desc: 'Must match the SFID UTC time.' },
      { name: 'Originator',           start: 67,  len: 25, desc: 'Must match the SFID originator SFID.' },
      { name: 'Destination',          start: 92,  len: 25, desc: 'Must match the SFID destination SFID.' },
      { name: 'Reason Code',          start: 117, len: 2,  desc: '"01"=User Code Not Known, "02"=Invalid Password, "03"=Incompatible Mode, "04"=Invalid File Signature, "05"=File Decryption Failure, "99"=Unspecified.' },
      { name: 'Reason Text',          start: 119, len: 80, desc: 'Human-readable rejection reason, space-padded.' },
      { name: 'Retry Indicator',      start: 199, len: 1,  desc: '"Y" = sender may retry this file; "N" = do not retry.' },
    ],
  },
  3: {
    name: 'SFNA — Start File Negative Answer',
    desc: 'The receiver refuses to accept the incoming file transfer before it begins.',
    fields: [
      { name: 'Command',              start: 0, len: 1,  desc: 'Fixed: "3"' },
      { name: 'Answer Reason',        start: 1, len: 2,  desc: '"01"=Invalid Filename, "02"=Invalid Destination, "03"=Invalid Origin, "04"=Storage Format Not Supported, "10"=Invalid Record Count, "11"=Invalid Byte Count, "12"=Access Failure, "13"=Duplicate File, "99"=Unspecified.' },
      { name: 'Retry Indicator',      start: 3, len: 1,  desc: '"Y" = sender may retry; "N" = do not retry.' },
      { name: 'Reason Text',          start: 4,           desc: 'Optional free-text explanation of the refusal.' },
    ],
  },
  F: {
    name: 'ESID — End Session',
    desc: 'Gracefully closes the OFTP2 session. Either party may send this.',
    fields: [
      { name: 'Command',              start: 0, len: 1,  desc: 'Fixed: "F"' },
      { name: 'Reason Code',          start: 1, len: 2,  desc: '"00"=Normal End, "01"=User Code Not Known, "02"=Invalid Password, "03"=Local Site Busy, "04"=Invalid Command, "05"=Protocol Error, "99"=Unspecified.' },
      { name: 'Reason Text',          start: 3,           desc: 'Human-readable session close reason.' },
    ],
  },
  R: {
    name: 'RTR — Ready To Receive',
    desc: 'Signals the receiver is ready to accept the next file or the next block of data (credit replenishment).',
    fields: [
      { name: 'Command',              start: 0, len: 1, desc: 'Fixed: "R" — no additional fields.' },
    ],
  },
  C: {
    name: 'CDT — Change Direction',
    desc: 'Transfers the initiator/responder send/receive role between parties in a half-duplex session.',
    fields: [
      { name: 'Command',              start: 0, len: 1, desc: 'Fixed: "C" — no additional fields.' },
    ],
  },
  D: {
    name: 'DATA — Data Transfer',
    desc: 'Carries a chunk of the file payload. The body is raw file data in the negotiated record format.',
    fields: [
      { name: 'Command',              start: 0, len: 1,  desc: 'Fixed: "D"' },
      { name: 'Payload',              start: 1,           desc: 'Raw file data. Content and format depend on the Record Format field negotiated in the SFID command (F=Fixed, V=Variable, U=Unstructured).' },
    ],
  },
}

function isHex(str) {
  return /^([0-9a-fA-F]{2}[ \t]+)+[0-9a-fA-F]{2}\s*$/.test(str.trim())
}

function fromHex(str) {
  return str.trim().split(/\s+/).map((h) => String.fromCharCode(parseInt(h, 16))).join('')
}

function extractField(str, field) {
  if (field.len != null) {
    return str.slice(field.start, field.start + field.len)
  }
  return str.slice(field.start)
}

export function OFTP2RecordDecoder() {
  const [raw, setRaw] = useState('')
  const [copied, setCopied] = useState(false)

  const trimmed = raw.trim()
  const decoded = trimmed ? (isHex(trimmed) ? fromHex(trimmed) : trimmed) : null
  const inputFormat = trimmed ? (isHex(trimmed) ? 'hex' : 'ascii') : null

  const cmdChar = decoded ? decoded[0] : null
  const cmd = cmdChar ? COMMANDS[cmdChar] : null

  const rows = cmd && decoded
    ? cmd.fields.map((f) => ({ ...f, value: extractField(decoded, f) }))
    : []

  function copy() {
    if (!cmd || !decoded) return
    const lines = [
      `OFTP2 Command: ${cmd.name}`,
      `Raw length: ${decoded.length} chars`,
      '',
      ...rows.map((r) => `${r.name}: ${r.value.trim() || '(blank)'}`),
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
            Paste OFTP2 record (ASCII or hex dump)
            <textarea
              className="proto-textarea"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={
                'Paste a raw OFTP2 command record — ASCII string or space-separated hex bytes.\n\n' +
                'ASCII example (SSID):\n' +
                'XPARTNER-A-SFID-HERE         p@ssw0rd006144YNY002Y        \n\n' +
                'Hex example:\n' +
                '58 50 41 52 54 4E 45 52 2D 41 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20'
              }
              spellCheck={false}
            />
          </label>

          {decoded && (
            <div className="oftp2-raw-panel">
              <div className="oftp2-raw-label">
                Interpreted as {inputFormat === 'hex' ? 'hex dump → converted to ASCII' : 'ASCII'} · {decoded.length} bytes
              </div>
              <code className="oftp2-raw-value">{decoded}</code>
            </div>
          )}
        </div>

        <div className="proto-results-panel">
          {!decoded && (
            <div className="proto-empty">
              <p>Paste an OFTP2 command record to decode it field by field.</p>
              <p>Supported commands: SSRM, SSID, SFID, EFID, EERP, NERP, SFNA, ESID, RTR, CDT, DATA.</p>
              <p>Accepts both raw ASCII strings and space-separated hex bytes (e.g. from Wireshark).</p>
            </div>
          )}

          {decoded && !cmd && (
            <div className="proto-alert">
              Unknown command byte: <code>{cmdChar}</code> (0x{cmdChar?.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}).
              Expected one of: O X H T E N 3 F R C D
            </div>
          )}

          {cmd && (
            <>
              <div className="proto-summary">
                <div className="proto-badge proto-badge--ok">{cmd.name}</div>
                <button type="button" className="secondary-button" onClick={copy}>
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy fields'}
                </button>
              </div>

              <p className="oftp2-cmd-desc">{cmd.desc}</p>

              <div className="oftp2-field-table">
                <div className="oftp2-field-header">
                  <span>Field</span>
                  <span>Extracted value</span>
                  <span>Spec note</span>
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="oftp2-field-row">
                    <span className="oftp2-field-name">
                      {r.name}
                      {r.len != null && (
                        <span className="oftp2-field-pos">
                          [{r.start}…{r.start + r.len - 1}]
                        </span>
                      )}
                      {r.len == null && (
                        <span className="oftp2-field-pos">[{r.start}…]</span>
                      )}
                    </span>
                    <code className="oftp2-field-val">{r.value.trim() || <em className="oftp2-blank">(blank)</em>}</code>
                    <span className="oftp2-field-desc">{r.desc}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
