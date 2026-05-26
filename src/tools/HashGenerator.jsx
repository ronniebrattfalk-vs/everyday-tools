import { useMemo, useState } from 'react'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'

const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
const sampleText = 'Everyday Tools hash generator'

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function digestValue(algorithm, bytes) {
  const hash = await crypto.subtle.digest(algorithm, bytes)
  return bytesToHex(hash)
}

function downloadText(value, filename) {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function HashGenerator() {
  const [input, setInput] = useState(sampleText)
  const [hashes, setHashes] = useState([])
  const [sourceName, setSourceName] = useState('Text input')
  const [message, setMessage] = useState('')

  const report = useMemo(
    () =>
      hashes
        .map((item) => `${item.algorithm}\n${item.value}`)
        .join('\n\n'),
    [hashes],
  )

  async function hashBytes(bytes, label) {
    const nextHashes = await Promise.all(
      algorithms.map(async (algorithm) => ({
        algorithm,
        value: await digestValue(algorithm, bytes),
      })),
    )
    setHashes(nextHashes)
    setSourceName(label)
    setMessage(`${label} hashed`)
  }

  async function hashText() {
    await hashBytes(new TextEncoder().encode(input), 'Text input')
  }

  async function hashFile(file) {
    if (!file) return
    await hashBytes(await file.arrayBuffer(), file.name)
  }

  async function copyHash(value, label) {
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copied`)
  }

  async function copyReport() {
    if (!report) return
    await navigator.clipboard.writeText(report)
    setMessage('Hash report copied')
  }

  function downloadReport() {
    if (!report) return
    downloadText(`${sourceName}\n\n${report}\n`, 'hash-report.txt')
    setMessage('Hash report downloaded')
  }

  function resetTool() {
    setInput(sampleText)
    setHashes([])
    setSourceName('Text input')
    setMessage('Reset hash generator')
  }

  return (
    <div className="tool-body hash-tool">
      <section className="hash-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Input</p>
            <h3>Text or file</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Text input
          <textarea className="hash-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={hashText} disabled={!input.trim()}>
            Generate hashes
          </button>
          <button type="button" className="secondary-button" onClick={copyReport} disabled={!report}>
            <Clipboard size={17} aria-hidden="true" />
            Copy all
          </button>
          <button type="button" className="secondary-button" onClick={downloadReport} disabled={!report}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        <label className="upload-box">
          <FileUp size={30} aria-hidden="true" />
          <span>Choose a file to hash</span>
          <small>Calculates hashes locally from the selected file.</small>
          <input type="file" onChange={(event) => hashFile(event.target.files?.[0])} />
        </label>

        <p className="helper-text">{message || 'Generate SHA hashes without uploading the input.'}</p>
      </section>

      <section className="hash-results">
        <div>
          <p className="eyebrow">Result</p>
          <h3>{sourceName}</h3>
        </div>

        {hashes.length > 0 ? (
          <div className="hash-result-list">
            {hashes.map((item) => (
              <article key={item.algorithm}>
                <div className="section-title-row">
                  <h3>{item.algorithm}</h3>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => copyHash(item.value, item.algorithm)}
                    aria-label={`Copy ${item.algorithm} hash`}
                  >
                    <Clipboard size={16} aria-hidden="true" />
                  </button>
                </div>
                <code>{item.value}</code>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Hashes appear after you generate them.</p>
          </div>
        )}
      </section>
    </div>
  )
}
