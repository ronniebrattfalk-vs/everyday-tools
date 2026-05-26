import { useMemo, useState } from 'react'
import { Clipboard, Link, RotateCcw } from 'lucide-react'

const sampleUrl = 'https://example.com/product'

function encodeValue(value, mode) {
  if (mode === 'component') return encodeURIComponent(value)
  return encodeURI(value)
}

function decodeValue(value, mode) {
  if (mode === 'component') return decodeURIComponent(value)
  return decodeURI(value)
}

function buildUtmUrl(baseUrl, params) {
  try {
    const url = new URL(baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      if (value.trim()) url.searchParams.set(key, value.trim())
    })
    return { value: url.toString(), error: '' }
  } catch (error) {
    return { value: '', error: error.message }
  }
}

export function URLBuilder() {
  const [input, setInput] = useState('https://example.com/search?q=everyday tools&sort=new')
  const [mode, setMode] = useState('uri')
  const [baseUrl, setBaseUrl] = useState(sampleUrl)
  const [utm, setUtm] = useState({
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'spring_launch',
    utm_term: '',
    utm_content: '',
  })
  const [message, setMessage] = useState('')

  const encoded = useMemo(() => {
    try {
      return { value: encodeValue(input, mode), error: '' }
    } catch (error) {
      return { value: '', error: error.message }
    }
  }, [input, mode])

  const decoded = useMemo(() => {
    try {
      return { value: decodeValue(input, mode), error: '' }
    } catch (error) {
      return { value: '', error: error.message }
    }
  }, [input, mode])

  const utmResult = useMemo(() => buildUtmUrl(baseUrl, utm), [baseUrl, utm])

  function updateUtm(key, value) {
    setUtm((current) => ({ ...current, [key]: value }))
  }

  async function copyText(value, label) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copied`)
  }

  function resetUrlTool() {
    setInput('https://example.com/search?q=everyday tools&sort=new')
    setMode('uri')
    setBaseUrl(sampleUrl)
    setUtm({
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'spring_launch',
      utm_term: '',
      utm_content: '',
    })
    setMessage('Reset URL tool')
  }

  return (
    <div className="tool-body url-tool">
      <section className="url-panel">
        <div className="category-tabs compact" aria-label="Encoding mode">
          <button type="button" className={mode === 'uri' ? 'is-active' : ''} onClick={() => setMode('uri')}>
            Full URL
          </button>
          <button type="button" className={mode === 'component' ? 'is-active' : ''} onClick={() => setMode('component')}>
            Component
          </button>
        </div>

        <label>
          URL or text
          <textarea className="url-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
        </label>

        <div className="url-output-grid">
          <article>
            <div className="section-title-row">
              <h3>Encoded</h3>
              <button type="button" className="icon-button" onClick={() => copyText(encoded.value, 'Encoded URL')} aria-label="Copy encoded URL">
                <Clipboard size={16} aria-hidden="true" />
              </button>
            </div>
            <code>{encoded.error || encoded.value}</code>
          </article>
          <article>
            <div className="section-title-row">
              <h3>Decoded</h3>
              <button type="button" className="icon-button" onClick={() => copyText(decoded.value, 'Decoded URL')} aria-label="Copy decoded URL">
                <Clipboard size={16} aria-hidden="true" />
              </button>
            </div>
            <code>{decoded.error || decoded.value}</code>
          </article>
        </div>
      </section>

      <section className="url-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Campaign URL</p>
            <h3>UTM builder</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetUrlTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Base URL
          <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
        </label>

        <div className="form-grid">
          {Object.keys(utm).map((key) => (
            <label key={key}>
              {key.replace('utm_', '')}
              <input value={utm[key]} onChange={(event) => updateUtm(key, event.target.value)} />
            </label>
          ))}
        </div>

        <div className="url-result-card">
          <Link size={18} aria-hidden="true" />
          <code>{utmResult.error || utmResult.value}</code>
          <button type="button" className="icon-button" onClick={() => copyText(utmResult.value, 'UTM URL')} aria-label="Copy UTM URL">
            <Clipboard size={16} aria-hidden="true" />
          </button>
        </div>

        <p className="helper-text">{message || 'Encode URLs and build campaign links locally.'}</p>
      </section>
    </div>
  )
}
