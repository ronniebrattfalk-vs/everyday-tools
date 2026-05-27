import { useMemo, useState } from 'react'
import { bigram, trigram } from 'n-gram'
import { Copy } from 'lucide-react'

const FILLER_WORDS = [
  'basically','essentially','actually','literally','obviously','clearly','just','simply',
  'very','really','quite','rather','somewhat','fairly','pretty','truly','totally',
  'absolutely','completely','definitely','certainly','probably','perhaps','maybe',
  'kind of','sort of','a bit','a lot',
]

const HEDGES = [
  'i think','i believe','i feel like','i suppose','it seems','it appears','might be',
  'could be','would suggest','tends to','in some ways','to some extent',
]

const PASSIVE_RE = /\b(am|is|are|was|were|be|been|being)\s+([\w]+ed|[\w]+en)\b/gi

const ADVERB_RE = /\b\w+ly\b/g

function sentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) ?? []
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function findPassive(text) {
  const found = []
  let m
  const re = new RegExp(PASSIVE_RE.source, 'gi')
  while ((m = re.exec(text)) !== null) found.push(m[0])
  return found
}

function findFillers(text) {
  const lower = text.toLowerCase()
  return FILLER_WORDS.filter(w => lower.includes(w))
}

function findHedges(text) {
  const lower = text.toLowerCase()
  return HEDGES.filter(h => lower.includes(h))
}

function findLongSentences(text, threshold = 30) {
  return sentences(text).filter(s => countWords(s) > threshold)
}

function findRepeatedWords(text) {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []
  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] ?? 0) + 1 })
  return Object.entries(freq)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w, n]) => `"${w}" ×${n}`)
}

function findAdverbs(text) {
  const matches = text.match(ADVERB_RE) ?? []
  const unique = [...new Set(matches.map(w => w.toLowerCase()))].slice(0, 8)
  return unique
}

// Stop words to exclude from phrase detection (articles, prepositions, conjunctions)
const STOP_WORDS = new Set([
  'the','and','for','that','this','with','are','was','were','has','have','had',
  'not','but','from','they','their','there','then','than','what','will','would',
  'can','could','should','its','into','onto','upon','over','under','about','after',
  'before','between','through','during','each','every','all','any','some','more',
  'most','other','such','when','where','which','who','whom','how','why','our',
  'your','his','her','its','its','you','also','even','may','yet','both','just',
  'been','being','does','did','let','per','via',
])

function findRepeatedPhrases(text) {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? []
  const filtered = words.filter(w => !STOP_WORDS.has(w))

  const freq = {}

  bigram(filtered).forEach(pair => {
    const key = pair.join(' ')
    freq[key] = (freq[key] ?? 0) + 1
  })

  trigram(filtered).forEach(triple => {
    const key = triple.join(' ')
    freq[key] = (freq[key] ?? 0) + 1
  })

  return Object.entries(freq)
    .filter(([phrase, n]) => {
      const wordCount = phrase.split(' ').length
      return wordCount === 2 ? n >= 3 : n >= 2
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase, n]) => `"${phrase}" ×${n}`)
}

function computeScore(issues) {
  let penalty = 0
  penalty += Math.min(issues.passive.length * 4, 20)
  penalty += Math.min(issues.fillers.length * 3, 15)
  penalty += Math.min(issues.hedges.length * 5, 20)
  penalty += Math.min(issues.longSentences.length * 5, 20)
  penalty += Math.min(issues.repeated.length * 3, 15)
  penalty += Math.min(issues.adverbs.length * 2, 10)
  penalty += Math.min(issues.phrases.length * 3, 15)
  return Math.max(0, 100 - penalty)
}

function scoreLabel(s) {
  if (s >= 85) return { label: 'Excellent', cls: 'score-excellent' }
  if (s >= 70) return { label: 'Good', cls: 'score-good' }
  if (s >= 50) return { label: 'Fair', cls: 'score-fair' }
  return { label: 'Needs Work', cls: 'score-poor' }
}

const ISSUE_DEFS = [
  { key: 'passive',       title: 'Passive Voice',       tip: 'Consider rewriting passives as active constructions for clarity.' },
  { key: 'hedges',        title: 'Hedging Language',     tip: 'Phrases like "I think" or "it seems" weaken your message.' },
  { key: 'fillers',       title: 'Filler Words',         tip: 'Words like "basically", "just", and "really" rarely add meaning.' },
  { key: 'adverbs',       title: 'Overused Adverbs',     tip: 'Adverbs often signal a weak verb. Try to find a stronger verb instead.' },
  { key: 'repeated',      title: 'Repeated Words',       tip: 'Words used 3+ times may be overused. Consider synonyms.' },
  { key: 'phrases',       title: 'Repeated Phrases',     tip: 'Multi-word phrases repeated across paragraphs can make writing feel monotonous.' },
  { key: 'longSentences', title: 'Long Sentences',       tip: 'Sentences over 30 words are hard to follow. Consider splitting them.' },
]

export function ProofreadingChecklist() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const issues = useMemo(() => {
    if (!text.trim()) return null
    return {
      passive:       findPassive(text),
      fillers:       findFillers(text),
      hedges:        findHedges(text),
      longSentences: findLongSentences(text),
      repeated:      findRepeatedWords(text),
      adverbs:       findAdverbs(text),
      phrases:       findRepeatedPhrases(text),
    }
  }, [text])

  const score  = issues ? computeScore(issues) : null
  const slabel = score !== null ? scoreLabel(score) : null

  const totalIssues = issues ? Object.values(issues).reduce((s, arr) => s + arr.length, 0) : 0
  const wordCount   = text.trim() ? countWords(text) : 0

  function copyText() {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="tool-body proof-tool">
      <div className="proof-input-section">
        <div className="field-group" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="field-label" style={{ margin: 0 }}>Your text</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {wordCount > 0 && <span className="proof-meta">{wordCount} words · {text.trim().split(/[.!?]+/).filter(Boolean).length} sentences</span>}
              <button type="button" className="secondary-button compact-button" onClick={copyText} disabled={!text}>
                <Copy size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            className="text-input proof-textarea"
            rows={10}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your text here to check for passive voice, filler words, long sentences, repeated phrases, and more..."
          />
        </div>
      </div>

      {issues && (
        <div className="proof-results">
          <div className="proof-score-card">
            <div className={`proof-score-circle ${slabel.cls}`}>
              <span className="proof-score-num">{score}</span>
              <span className="proof-score-label">{slabel.label}</span>
            </div>
            <div className="proof-score-summary">
              <strong>Writing Quality Score</strong>
              <p>{totalIssues === 0
                ? 'Great job! No common issues found.'
                : `${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found across ${Object.values(issues).filter(a => a.length > 0).length} categories.`}
              </p>
            </div>
          </div>

          <div className="proof-issues-grid">
            {ISSUE_DEFS.map(({ key, title, tip }) => {
              const arr = issues[key]
              const hasIssues = arr.length > 0
              return (
                <div key={key} className={`proof-issue-card ${hasIssues ? 'proof-issue-card--found' : 'proof-issue-card--ok'}`}>
                  <div className="proof-issue-top">
                    <span className="proof-issue-title">{title}</span>
                    <span className={`proof-issue-badge ${hasIssues ? 'badge-warn' : 'badge-ok'}`}>
                      {hasIssues ? arr.length : '✓'}
                    </span>
                  </div>
                  {hasIssues && (
                    <>
                      <p className="proof-issue-tip">{tip}</p>
                      <div className="proof-issue-tags">
                        {key === 'longSentences'
                          ? arr.slice(0, 3).map((s, i) => (
                              <span key={i} className="proof-tag proof-tag--sentence">
                                {s.trim().slice(0, 60)}{s.trim().length > 60 ? '…' : ''}
                              </span>
                            ))
                          : arr.slice(0, 8).map((w, i) => (
                              <span key={i} className="proof-tag">{w}</span>
                            ))
                        }
                        {arr.length > (key === 'longSentences' ? 3 : 8) && (
                          <span className="proof-tag proof-tag--more">+{arr.length - (key === 'longSentences' ? 3 : 8)} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!text.trim() && (
        <p className="proof-empty-state">Paste your text above to get a writing quality analysis.</p>
      )}

      <p className="helper-text">Analysis runs locally in your browser. No text is sent anywhere.</p>
    </div>
  )
}
