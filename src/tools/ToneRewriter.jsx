import { useMemo, useState } from 'react'
import nlp from 'compromise'
import { Clipboard, Download, Loader2, RotateCcw, Zap } from 'lucide-react'

const API_KEY_STORAGE  = 'everyday-tools.tone-rewriter-api-key'
const AI_MODEL_STORAGE = 'everyday-tools.tone-rewriter-model'

const sampleText = 'We just wanted to quickly check in because the report was kind of delayed and it might be helpful if the final numbers could be sent over today.'

const hedgeWords  = ['kind of', 'sort of', 'maybe', 'perhaps', 'probably', 'just', 'quite', 'a bit']
const fillerWords = ['really', 'very', 'basically', 'actually', 'literally', 'simply', 'definitely']

const TONE_CONTEXT = {
  concise:   'Sentences are tightened to direct, active statements.',
  friendly:  'Contractions added, warm opening and closing framing applied.',
  formal:    'Contractions expanded and formal professional register applied.',
  executive: 'Compressed into a request-and-outcome brief.',
}

// ── Contraction tables ────────────────────────────────────────────────────────

const CONTRACTIONS_EXPAND = [
  ["can't", 'cannot'], ["won't", 'will not'], ["don't", 'do not'],
  ["doesn't", 'does not'], ["isn't", 'is not'], ["aren't", 'are not'],
  ["wasn't", 'was not'], ["weren't", 'were not'], ["wouldn't", 'would not'],
  ["couldn't", 'could not'], ["shouldn't", 'should not'], ["mustn't", 'must not'],
  ["I'm", 'I am'], ["I've", 'I have'], ["I'll", 'I will'], ["I'd", 'I would'],
  ["it's", 'it is'], ["that's", 'that is'], ["there's", 'there is'],
  ["they're", 'they are'], ["we're", 'we are'], ["you're", 'you are'],
  ["we've", 'we have'], ["you've", 'you have'], ["they've", 'they have'],
  ["he's", 'he is'], ["she's", 'she is'],
]

const CONTRACTIONS_CONTRACT = [
  ['cannot', "can't"], ['will not', "won't"], ['do not', "don't"],
  ['does not', "doesn't"], ['is not', "isn't"], ['are not', "aren't"],
  ['was not', "wasn't"], ['were not', "weren't"], ['would not', "wouldn't"],
  ['could not', "couldn't"], ['should not', "shouldn't"],
  ['I am', "I'm"], ['I have', "I've"], ['I will', "I'll"], ['I would', "I'd"],
  ['it is', "it's"], ['that is', "that's"], ['there is', "there's"],
  ['they are', "they're"], ['we are', "we're"], ['you are', "you're"],
]

// ── AI configuration ──────────────────────────────────────────────────────────

const ANTHROPIC_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku (fast)' },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet (best quality)' },
]

const TONE_PROMPTS = {
  concise: `You are a professional writing editor. Rewrite the provided text to be concise and direct.

Rules:
- Use active voice throughout
- Remove all hedge words (just, maybe, perhaps, kind of, sort of, a bit, quite) and filler words (really, very, basically, actually, literally, simply, definitely)
- Split long sentences (over 20 words) into shorter ones where it improves clarity
- Make every sentence a direct statement or clear request
- Do NOT add new information that was not in the original
- Return ONLY the rewritten text, no explanations or labels`,

  friendly: `You are a professional writing editor. Rewrite the provided text to be warm, conversational, and approachable.

Rules:
- Use contractions naturally (can't, I'd, you'll, we're, etc.)
- Add a brief, contextually appropriate warm opening line
- End with a friendly, helpful closing line
- Maintain a professional but human tone — not overly casual or emoji-heavy
- Preserve all essential information
- Return ONLY the rewritten text, no explanations or labels`,

  formal: `You are a professional writing editor. Rewrite the provided text in formal professional register.

Rules:
- Expand all contractions (cannot, will not, I would, we are, etc.)
- Replace casual vocabulary with formal, precise equivalents
- Use active voice where possible; passive is acceptable when it sounds more natural
- Open with a suitable formal introduction and close with a professional request for confirmation or next steps
- Return ONLY the rewritten text, no explanations or labels`,

  executive: `You are a senior executive writing assistant. Compress the provided text into a sharp, high-impact executive message.

Rules:
- Lead immediately with the ask, decision, or critical information — zero preamble
- Use confident, direct language with strong verbs
- Maximum 3 sentences unless the content genuinely requires more
- State what is needed and by when, if applicable
- No pleasantries, no hedging, no background context unless required for action
- Return ONLY the rewritten text, no explanations or labels`,
}

async function callAnthropicAPI(text, tone, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: TONE_PROMPTS[tone],
      messages: [{ role: 'user', content: text }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API error ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}

// ── Local rewrite helpers ─────────────────────────────────────────────────────

function sentenceCase(value) {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed ? `${trimmed[0].toUpperCase()}${trimmed.slice(1)}` : ''
}

function splitSentences(text) {
  const result = nlp(text).sentences().out('array')
  return result.length
    ? result.map((s) => s.trim()).filter(Boolean)
    : [text.trim()].filter(Boolean)
}

function detectPassive(sentence) {
  return /\b(?:was|were|is|are|been|be|being)\s+\w+(?:ed|en)\b/i.test(sentence)
}

function expandContractions(text) {
  let result = text
  for (const [short, long] of CONTRACTIONS_EXPAND) {
    result = result.replace(new RegExp(`\\b${short}\\b`, 'gi'), long)
  }
  return result
}

function contractWords(text) {
  let result = text
  for (const [long, short] of CONTRACTIONS_CONTRACT) {
    result = result.replace(new RegExp(`\\b${long}\\b`, 'gi'), short)
  }
  return result
}

function stripSofteners(text) {
  return text
    .replace(/\b(?:just|really|very|basically|actually|literally|simply|definitely)\b/gi, '')
    .replace(/\b(?:kind of|sort of|maybe|perhaps|probably|a bit|quite)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toAction(sentence) {
  const result = sentence
    .replace(/\bcould be sent(?: over)?\b/gi, 'please send')
    .replace(/\bcould be (\w+ed)\b/gi, (_, v) => `please ${v.replace(/ed$/, '')}`)
    .replace(/\bit might be helpful if\b/gi, '')
    .replace(/\bwe (?:just )?wanted to (?:quickly )?/gi, '')
    .replace(/\bwas (\w+ed)\b/gi, 'is $1')
    .replace(/^\s*if\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  return sentenceCase(result)
}

function analyzeText(value) {
  if (!value.trim()) {
    return { normalized: '', sentences: [], words: [], hedges: [], fillers: [], passiveSentences: [], longSentences: [], formality: 'neutral' }
  }
  const normalized = sentenceCase(value)
  const lower      = normalized.toLowerCase()
  const sentences  = splitSentences(normalized)
  const words      = normalized.match(/\b[\w'-]+\b/g) ?? []

  const hedges           = hedgeWords.filter((w) => lower.includes(w))
  const fillers          = fillerWords.filter((w) => lower.includes(w))
  const passiveSentences = sentences.filter(detectPassive)
  const longSentences    = sentences.filter((s) => (s.match(/\b[\w'-]+\b/g) ?? []).length > 20)
  const formality        = /\bplease|appreciate|regards|confirm|review\b/i.test(normalized) ? 'formal' : 'neutral'

  return { normalized, sentences, words, hedges, fillers, passiveSentences, longSentences, formality }
}

function rewriteTextLocal(value, tone) {
  const { normalized } = analyzeText(value)
  if (!normalized) return ''

  const stripped  = sentenceCase(stripSofteners(normalized))
  const directParts = splitSentences(stripped).map((s) => sentenceCase(toAction(s)))
  const direct    = directParts.join(' ')

  if (tone === 'concise') {
    return splitSentences(direct).map((s) => s.replace(/\.?$/, '.')).join(' ')
  }
  if (tone === 'friendly') {
    const contracted = contractWords(stripped)
    return `Hi there, ${splitSentences(contracted).map((s) => s.replace(/\.?$/, '.')).join(' ')} Thanks for your help on this.`
      .replace(/\s+/g, ' ').trim()
  }
  if (tone === 'formal') {
    const expanded = expandContractions(stripped)
    return `Please review the following: ${splitSentences(expanded).map((s) => s.replace(/\.?$/, '.')).join(' ')} I would appreciate your confirmation once complete.`
      .replace(/\s+/g, ' ').trim()
  }
  if (tone === 'executive') {
    return `Request: ${splitSentences(direct).map((s) => s.replace(/\.?$/, '.')).join(' ')} Needed outcome: action and confirmation of any blockers.`
      .replace(/\s+/g, ' ').trim()
  }
  return stripped
}

function rewriteSentenceLocal(sentence, tone) {
  const cleaned = sentenceCase(stripSofteners(sentence))
  if (tone === 'formal')   return expandContractions(sentenceCase(toAction(cleaned))).replace(/\.?$/, '.')
  if (tone === 'friendly') return contractWords(cleaned).replace(/\.?$/, '.')
  return sentenceCase(toAction(cleaned)).replace(/\.?$/, '.')
}

function detectChanges(original, rewritten) {
  if (original.trim() === rewritten.trim()) return 'no changes'
  const reasons = []

  const removedSofteners = [
    ...hedgeWords.filter((w) => original.toLowerCase().includes(w) && !rewritten.toLowerCase().includes(w)),
    ...fillerWords.filter((w) => original.toLowerCase().includes(w) && !rewritten.toLowerCase().includes(w)),
  ]
  if (removedSofteners.length) reasons.push(`removed: ${removedSofteners.join(', ')}`)
  if (detectPassive(original) && !detectPassive(rewritten)) reasons.push('passive → active')

  const origLen = (original.match(/\b[\w'-]+\b/g) ?? []).length
  const rewLen  = (rewritten.match(/\b[\w'-]+\b/g) ?? []).length
  if (rewLen < origLen * 0.8) reasons.push(`shorter (${origLen}→${rewLen} words)`)

  return reasons.length ? reasons.join(' · ') : 'rephrased'
}

function buildCompareRows(sentences, tone) {
  return sentences.map((sentence) => {
    const rewritten = rewriteSentenceLocal(sentence, tone)
    const unchanged = sentence.trim() === rewritten.trim()
    return { original: sentence, rewritten, why: detectChanges(sentence, rewritten), unchanged }
  })
}

function downloadText(value, filename) {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ToneRewriter() {
  const [input,   setInput]   = useState(sampleText)
  const [tone,    setTone]    = useState('friendly')
  const [view,    setView]    = useState('compare')
  const [message, setMessage] = useState('')

  // AI state
  const [apiKey,       setApiKey]       = useState(() => localStorage.getItem(API_KEY_STORAGE)  ?? '')
  const [aiModel,      setAiModel]      = useState(() => localStorage.getItem(AI_MODEL_STORAGE) ?? 'claude-haiku-4-5-20251001')
  const [showApiPanel, setShowApiPanel] = useState(false)
  const [keyDraft,     setKeyDraft]     = useState('')
  const [aiOutput,     setAiOutput]     = useState('')
  const [aiLoading,    setAiLoading]    = useState(false)
  const [aiError,      setAiError]      = useState('')
  const [aiContext,    setAiContext]     = useState({ input: '', tone: '' })

  const localOutput  = useMemo(() => rewriteTextLocal(input, tone), [input, tone])
  const analysis     = useMemo(() => analyzeText(input), [input])
  const compareRows  = useMemo(() => buildCompareRows(analysis.sentences, tone), [analysis.sentences, tone])

  const aiMode    = !!apiKey
  const aiIsStale = !!aiOutput && (aiContext.input !== input.trim() || aiContext.tone !== tone)
  const activeOutput = aiMode && aiOutput && !aiIsStale ? aiOutput : localOutput

  function saveApiKey() {
    const trimmed = keyDraft.trim()
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed)
    } else {
      localStorage.removeItem(API_KEY_STORAGE)
    }
    setApiKey(trimmed)
    setKeyDraft('')
    setAiOutput('')
    setAiError('')
    setMessage(trimmed ? 'API key saved — AI mode active' : 'API key cleared')
  }

  function clearApiKey() {
    localStorage.removeItem(API_KEY_STORAGE)
    setApiKey('')
    setKeyDraft('')
    setAiOutput('')
    setAiError('')
    setMessage('API key cleared')
  }

  function handleModelChange(m) {
    setAiModel(m)
    localStorage.setItem(AI_MODEL_STORAGE, m)
    setAiOutput('')
    setAiError('')
  }

  function handleInputChange(value) {
    setInput(value)
    setAiOutput('')
    setAiError('')
  }

  function handleToneChange(t) {
    setTone(t)
    setAiOutput('')
    setAiError('')
  }

  async function handleAiRewrite() {
    if (!apiKey || !input.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiOutput('')
    try {
      const result = await callAnthropicAPI(input.trim(), tone, apiKey, aiModel)
      setAiOutput(result)
      setAiContext({ input: input.trim(), tone })
      setMessage('AI rewrite complete')
    } catch (err) {
      setAiError(err.message)
      setMessage('AI rewrite failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(activeOutput)
    setMessage('Rewritten text copied')
  }

  function downloadOutput() {
    downloadText(activeOutput, 'rewritten-text.txt')
    setMessage('Rewritten text downloaded')
  }

  function resetTool() {
    setInput(sampleText)
    setTone('friendly')
    setView('compare')
    setAiOutput('')
    setAiError('')
    setMessage('Reset tone rewriter')
  }

  const modelLabel = ANTHROPIC_MODELS.find((m) => m.id === aiModel)?.label ?? aiModel

  return (
    <div className="tool-body tone-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Writing</p>
            <h3>Tone rewriter</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Tone">
          {['concise', 'friendly', 'formal', 'executive'].map((item) => (
            <button
              type="button"
              key={item}
              className={tone === item ? 'is-active' : ''}
              onClick={() => handleToneChange(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* AI mode bar */}
        <div className="tone-ai-bar">
          <button
            type="button"
            className={`secondary-button tone-ai-toggle${aiMode ? ' tone-ai-toggle--on' : ''}${showApiPanel ? ' is-active' : ''}`}
            onClick={() => { setShowApiPanel((v) => !v); setKeyDraft(apiKey) }}
          >
            <Zap size={14} aria-hidden="true" />
            {aiMode ? 'AI mode on' : 'AI mode'}
          </button>
          {aiMode && !showApiPanel && (
            <span className="tone-ai-badge">{modelLabel}</span>
          )}
          {!aiMode && !showApiPanel && (
            <span className="tone-ai-hint">Add an Anthropic API key for full semantic rewrites</span>
          )}
        </div>

        {showApiPanel && (
          <div className="tone-ai-panel">
            <label className="field-label">
              Anthropic API key
              <span className="field-label-hint"> — stored in your browser only, sent exclusively to Anthropic</span>
            </label>
            <div className="tone-ai-key-row">
              <input
                type="password"
                className="text-input"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
                placeholder="sk-ant-..."
                autoComplete="off"
              />
              <button type="button" className="primary-button" onClick={saveApiKey}>Save</button>
              {apiKey && (
                <button type="button" className="secondary-button" onClick={clearApiKey}>Clear</button>
              )}
            </div>
            <div className="tone-ai-model-row">
              <span className="field-label" style={{ margin: 0 }}>Model</span>
              {ANTHROPIC_MODELS.map((m) => (
                <label key={m.id} className="tone-ai-model-option">
                  <input
                    type="radio"
                    name="ai-model"
                    value={m.id}
                    checked={aiModel === m.id}
                    onChange={() => handleModelChange(m.id)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <label>
          Original text
          <textarea
            className="headers-textarea"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </label>

        <div className="writing-results tone-analysis-grid">
          <article>
            <span>Sentence length</span>
            <strong>{analysis.longSentences.length ? 'Long' : 'Balanced'}</strong>
            <p>{analysis.sentences.length
              ? `${Math.round(analysis.words.length / analysis.sentences.length)} avg words per sentence`
              : 'No sentences yet'}
            </p>
          </article>
          <article>
            <span>Passive voice</span>
            <strong>{analysis.passiveSentences.length}</strong>
            <p>{analysis.passiveSentences.length
              ? analysis.passiveSentences[0]
              : 'No passive constructions detected'}
            </p>
          </article>
          <article>
            <span>Softeners</span>
            <strong>{analysis.hedges.length + analysis.fillers.length}</strong>
            <p>{[...analysis.hedges, ...analysis.fillers].join(', ') || 'No filler or hedging phrases detected'}</p>
          </article>
          <article className="wide">
            <span>Detected style</span>
            <strong>{analysis.formality}</strong>
            <p>{aiMode
              ? `AI mode active — ${modelLabel} rewrites the full text with a tone-specific system prompt for genuine semantic paraphrasing.`
              : 'Local mode — strips softeners, expands or contracts contractions, and restructures passive constructions based on the selected tone.'}
            </p>
          </article>
        </div>

        <div className="button-row">
          {aiMode && (
            <button
              type="button"
              className="primary-button"
              onClick={handleAiRewrite}
              disabled={aiLoading || !input.trim()}
            >
              {aiLoading
                ? <><Loader2 size={15} className="tone-spin" aria-hidden="true" />Rewriting…</>
                : <><Zap size={15} aria-hidden="true" />AI Rewrite</>
              }
            </button>
          )}
          <button type="button" className="secondary-button" onClick={copyOutput} disabled={!activeOutput}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput} disabled={!activeOutput}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        {aiError && <p className="tone-ai-error">{aiError}</p>}
        {aiIsStale && !aiLoading && (
          <p className="tone-ai-stale">Input or tone changed — click AI Rewrite to refresh.</p>
        )}

        <p className="helper-text">
          {message || (aiMode
            ? 'Click "AI Rewrite" to generate a full semantic rewrite using Claude.'
            : 'Local mode detects passive voice, softeners, and sentence length before rewriting.')}
        </p>
      </section>

      <section className="checklist-output">
        <div className="tone-view-tabs">
          <button
            type="button"
            className={view === 'compare' ? 'is-active' : ''}
            onClick={() => setView('compare')}
          >
            {aiMode && aiOutput && !aiIsStale ? 'AI comparison' : 'Sentence compare'}
          </button>
          <button
            type="button"
            className={view === 'text' ? 'is-active' : ''}
            onClick={() => setView('text')}
          >
            Full text
          </button>
        </div>

        {view === 'text' && (
          <textarea
            className="code-area"
            value={aiLoading ? 'Rewriting…' : activeOutput}
            readOnly
            spellCheck="false"
          />
        )}

        {view === 'compare' && (
          <div className="tone-compare">
            {/* AI mode: show full-text side-by-side */}
            {aiMode && aiOutput && !aiIsStale ? (
              <>
                <p className="tone-compare-context">
                  AI rewrite · {tone} tone · {modelLabel}
                </p>
                <div className="tone-compare-row tone-compare-row--ai">
                  <div className="tone-compare-cell tone-compare-cell--orig">
                    <span className="tone-compare-label">Original</span>
                    <span>{input}</span>
                  </div>
                  <div className="tone-compare-cell tone-compare-cell--new">
                    <span className="tone-compare-label">AI rewritten ({tone})</span>
                    <span>{aiOutput}</span>
                  </div>
                  <div className="tone-compare-why">semantic rewrite via {modelLabel}</div>
                </div>
              </>
            ) : aiMode && !aiOutput && !aiLoading ? (
              <p className="tone-compare-empty">
                {input.trim()
                  ? 'Click "AI Rewrite" to see a full semantic comparison.'
                  : 'Add some text on the left, then click "AI Rewrite".'}
              </p>
            ) : aiLoading ? (
              <p className="tone-compare-empty">
                <Loader2 size={16} className="tone-spin" style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
                Generating rewrite…
              </p>
            ) : (
              /* Local mode: sentence-by-sentence */
              <>
                {TONE_CONTEXT[tone] && (
                  <p className="tone-compare-context">{TONE_CONTEXT[tone]}</p>
                )}
                {compareRows.length === 0 && (
                  <p className="tone-compare-empty">Add some text on the left to see a sentence-by-sentence breakdown.</p>
                )}
                {compareRows.map((row, i) => (
                  <div key={i} className={`tone-compare-row${row.unchanged ? ' tone-compare-row--same' : ''}`}>
                    <div className="tone-compare-cell tone-compare-cell--orig">
                      <span className="tone-compare-label">Original</span>
                      <span>{row.original}</span>
                    </div>
                    <div className="tone-compare-cell tone-compare-cell--new">
                      <span className="tone-compare-label">{tone}</span>
                      <span>{row.rewritten}</span>
                    </div>
                    <div className="tone-compare-why">{row.why}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
