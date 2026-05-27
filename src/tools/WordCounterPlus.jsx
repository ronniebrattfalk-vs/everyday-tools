import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw } from 'lucide-react'

const sampleText = `Everyday Tools is a browser-only utility suite focused on practical local workflows.

The strongest tools are fast, private, and easy to understand. This counter helps review drafts before publishing.`

function readabilityGrade(score) {
  if (score >= 90) return 'Very Easy (5th grade)'
  if (score >= 80) return 'Easy (6th grade)'
  if (score >= 70) return 'Fairly Easy (7th grade)'
  if (score >= 60) return 'Standard (8th–9th grade)'
  if (score >= 50) return 'Fairly Difficult (10th–12th grade)'
  if (score >= 30) return 'Difficult (College level)'
  return 'Very Confusing (Professional)'
}

function countSyllables(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!cleaned) return 0
  const groups = cleaned.match(/[aeiouy]+/g)?.length || 1
  return cleaned.endsWith('e') ? Math.max(groups - 1, 1) : groups
}

function topKeywords(words) {
  const stop = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'are', 'you', 'your', 'before', 'after', 'from'])
  const counts = words.reduce((map, word) => {
    const key = word.toLowerCase()
    if (key.length < 3 || stop.has(key)) return map
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())
  return Array.from(counts.entries())
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, 8)
}

export function WordCounterPlus() {
  const [text, setText] = useState(sampleText)
  const [message, setMessage] = useState('')

  const stats = useMemo(() => {
    const words = text.match(/\b[\w'-]+\b/g) || []
    const sentences = text.split(/[.!?]+/).filter((item) => item.trim()).length
    const paragraphs = text.split(/\n\s*\n/).filter((item) => item.trim()).length
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
    const readability = sentences && words.length ? 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length) : 0
    return {
      characters: text.length,
      keywords: topKeywords(words),
      paragraphs,
      readability,
      readingMinutes: Math.max(words.length / 220, 0),
      sentences,
      words: words.length,
    }
  }, [text])

  async function copySummary() {
    const summary = [
      `${stats.words} words`,
      `${stats.sentences} sentences`,
      `${stats.paragraphs} paragraphs`,
      `${stats.characters} characters`,
      `${stats.readingMinutes.toFixed(1)} min read`,
      `Readability: ${stats.readability.toFixed(1)}`,
    ].join('\n')
    await navigator.clipboard.writeText(summary)
    setMessage('Writing stats copied')
  }

  function resetTool() {
    setText(sampleText)
    setMessage('Reset word counter')
  }

  return (
    <div className="tool-body writing-analysis-tool">
      <section className="headers-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Writing</p>
            <h3>Word counter plus</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <label>
          Draft text
          <textarea className="headers-textarea" value={text} onChange={(event) => setText(event.target.value)} />
        </label>

        <button type="button" className="primary-button" onClick={copySummary}>
          <Clipboard size={17} aria-hidden="true" />
          Copy stats
        </button>

        <p className="helper-text">{message || 'Analyze readability, frequency, and estimated reading time locally.'}</p>
      </section>

      <section className="writing-results">
        {[
          ['Words', stats.words],
          ['Sentences', stats.sentences],
          ['Paragraphs', stats.paragraphs],
          ['Characters', stats.characters],
          ['Read time', `${stats.readingMinutes.toFixed(1)} min`],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
        <article>
          <span>Readability</span>
          <strong>{stats.readability.toFixed(1)}</strong>
          <small className="wc-grade">{readabilityGrade(stats.readability)}</small>
        </article>
        <article className="wide">
          <span>Top keywords</span>
          <p>{stats.keywords.map(([word, count]) => `${word} (${count})`).join(', ') || 'No keywords yet.'}</p>
        </article>
      </section>
    </div>
  )
}
