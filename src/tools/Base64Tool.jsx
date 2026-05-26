import { useMemo, useState } from 'react'
import { Clipboard, Download, FileUp, RotateCcw } from 'lucide-react'

const sampleText = 'Everyday Tools keeps this conversion local in your browser.'

function bytesToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(value) {
  const cleaned = value.replace(/^data:[^,]+,/, '').replace(/\s/g, '')
  const binary = atob(cleaned)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function Base64Tool() {
  const [mode, setMode] = useState('encode')
  const [text, setText] = useState(sampleText)
  const [fileName, setFileName] = useState('')
  const [fileBase64, setFileBase64] = useState('')
  const [decodeFileName, setDecodeFileName] = useState('decoded-file.txt')
  const [message, setMessage] = useState('')

  const textResult = useMemo(() => {
    try {
      if (mode === 'encode') {
        return { value: bytesToBase64(new TextEncoder().encode(text)), error: '' }
      }
      return { value: new TextDecoder().decode(base64ToBytes(text)), error: '' }
    } catch (error) {
      return { value: '', error: error.message }
    }
  }, [mode, text])

  async function copyOutput() {
    if (!textResult.value) return
    await navigator.clipboard.writeText(textResult.value)
    setMessage('Output copied')
  }

  function downloadTextOutput() {
    if (!textResult.value) return
    const extension = mode === 'encode' ? 'txt' : 'decoded.txt'
    downloadBlob(new Blob([textResult.value], { type: 'text/plain;charset=utf-8' }), `base64-${extension}`)
    setMessage('Text output downloaded')
  }

  async function encodeFile(file) {
    if (!file) return
    const bytes = new Uint8Array(await file.arrayBuffer())
    setFileName(file.name)
    setFileBase64(bytesToBase64(bytes))
    setMessage(`${file.name} encoded`)
  }

  async function copyFileBase64() {
    if (!fileBase64) return
    await navigator.clipboard.writeText(fileBase64)
    setMessage('File Base64 copied')
  }

  function downloadFileBase64() {
    if (!fileBase64) return
    downloadBlob(new Blob([fileBase64], { type: 'text/plain;charset=utf-8' }), `${fileName || 'file'}.base64.txt`)
    setMessage('File Base64 downloaded')
  }

  function downloadDecodedFile() {
    try {
      const bytes = base64ToBytes(text)
      downloadBlob(new Blob([bytes]), decodeFileName.trim() || 'decoded-file')
      setMessage('Decoded file downloaded')
    } catch (error) {
      setMessage(error.message)
    }
  }

  function resetTool() {
    setMode('encode')
    setText(sampleText)
    setFileName('')
    setFileBase64('')
    setDecodeFileName('decoded-file.txt')
    setMessage('Reset Base64 tool')
  }

  return (
    <div className="tool-body base64-tool">
      <section className="base64-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Text</p>
            <h3>Encode or decode</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Base64 text mode">
          <button type="button" className={mode === 'encode' ? 'is-active' : ''} onClick={() => setMode('encode')}>
            Encode
          </button>
          <button type="button" className={mode === 'decode' ? 'is-active' : ''} onClick={() => setMode('decode')}>
            Decode
          </button>
        </div>

        <label>
          Input
          <textarea className="base64-textarea" value={text} onChange={(event) => setText(event.target.value)} />
        </label>

        <article className={textResult.error ? 'base64-output is-error' : 'base64-output'}>
          <div className="section-title-row">
            <h3>{mode === 'encode' ? 'Base64 output' : 'Decoded text'}</h3>
            <div className="button-row">
              <button type="button" className="icon-button" onClick={copyOutput} disabled={!textResult.value} aria-label="Copy output">
                <Clipboard size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={downloadTextOutput}
                disabled={!textResult.value}
                aria-label="Download output"
              >
                <Download size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <code>{textResult.error || textResult.value || 'Output appears here.'}</code>
        </article>
      </section>

      <section className="base64-panel">
        <div>
          <p className="eyebrow">Files</p>
          <h3>Small file conversion</h3>
        </div>

        <label className="upload-box">
          <FileUp size={30} aria-hidden="true" />
          <span>{fileName || 'Choose a file to encode'}</span>
          <small>Creates a Base64 text output locally.</small>
          <input type="file" onChange={(event) => encodeFile(event.target.files?.[0])} />
        </label>

        <article className="base64-output">
          <div className="section-title-row">
            <h3>File Base64</h3>
            <div className="button-row">
              <button type="button" className="icon-button" onClick={copyFileBase64} disabled={!fileBase64} aria-label="Copy file Base64">
                <Clipboard size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={downloadFileBase64}
                disabled={!fileBase64}
                aria-label="Download file Base64"
              >
                <Download size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <code>{fileBase64 || 'Encoded file output appears here.'}</code>
        </article>

        <div className="base64-decode-card">
          <label>
            Decoded file name
            <input value={decodeFileName} onChange={(event) => setDecodeFileName(event.target.value)} />
          </label>
          <button type="button" className="primary-button" onClick={downloadDecodedFile} disabled={mode !== 'decode' || !text.trim()}>
            <Download size={17} aria-hidden="true" />
            Download decoded file
          </button>
        </div>

        <p className="helper-text">{message || 'Use decode mode to turn pasted Base64 into a downloadable file.'}</p>
      </section>
    </div>
  )
}
