import { useMemo, useState } from 'react'
import { Clipboard, Download, RotateCcw } from 'lucide-react'

const words = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'curabitur',
  'placerat',
  'semper',
  'nibh',
  'vitae',
  'aliquet',
  'turpis',
  'porta',
  'integer',
  'rhoncus',
  'magna',
  'vel',
  'sapien',
  'facilisis',
  'praesent',
  'mattis',
  'neque',
  'faucibus',
  'ornare',
  'felis',
  'gravida',
  'tellus',
]

function sentenceFrom(index, length) {
  const selected = Array.from({ length }, (_, wordIndex) => words[(index + wordIndex) % words.length])
  const sentence = selected.join(' ')
  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`
}

function generateLorem(type, count) {
  const safeCount = Math.min(Math.max(Number(count) || 1, 1), 100)
  if (type === 'words') return Array.from({ length: safeCount }, (_, index) => words[index % words.length]).join(' ')
  if (type === 'sentences') return Array.from({ length: safeCount }, (_, index) => sentenceFrom(index * 4, 9)).join(' ')
  if (type === 'names') {
    return Array.from({ length: safeCount }, (_, index) => {
      const first = words[(index * 2) % words.length]
      const last = words[(index * 2 + 7) % words.length]
      return `${first[0].toUpperCase()}${first.slice(1)} ${last[0].toUpperCase()}${last.slice(1)}`
    }).join('\n')
  }
  if (type === 'ui') {
    return Array.from({ length: safeCount }, (_, index) => {
      const action = ['Create', 'Review', 'Update', 'Publish', 'Archive'][index % 5]
      const target = ['project', 'profile', 'report', 'template', 'workspace'][index % 5]
      return `${action} ${target}`
    }).join('\n')
  }

  return Array.from({ length: safeCount }, (_, index) => {
    const sentences = Array.from({ length: 4 }, (_, sentenceIndex) => sentenceFrom(index * 6 + sentenceIndex * 5, 10))
    return sentences.join(' ')
  }).join('\n\n')
}

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
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

export function LoremIpsumGenerator() {
  const [type, setType] = useState('paragraphs')
  const [count, setCount] = useState(3)
  const [message, setMessage] = useState('')

  const output = useMemo(() => generateLorem(type, count), [count, type])
  const stats = useMemo(
    () => ({
      words: countWords(output),
      characters: output.length,
      lines: output ? output.split('\n').length : 0,
    }),
    [output],
  )

  async function copyOutput() {
    await navigator.clipboard.writeText(output)
    setMessage('Placeholder text copied')
  }

  function downloadOutput() {
    downloadText(output, 'placeholder-text.txt')
    setMessage('Placeholder text downloaded')
  }

  function resetTool() {
    setType('paragraphs')
    setCount(3)
    setMessage('Reset lorem ipsum generator')
  }

  return (
    <div className="tool-body lorem-tool">
      <section className="lorem-controls">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Placeholder copy</p>
            <h3>Generate text</h3>
          </div>
          <button type="button" className="secondary-button" onClick={resetTool}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="category-tabs compact" aria-label="Placeholder text type">
          {['paragraphs', 'sentences', 'words', 'names', 'ui'].map((item) => (
            <button type="button" key={item} className={type === item ? 'is-active' : ''} onClick={() => setType(item)}>
              {item === 'ui' ? 'UI copy' : item}
            </button>
          ))}
        </div>

        <label>
          Amount
          <input type="number" min="1" max="100" value={count} onChange={(event) => setCount(event.target.value)} />
        </label>

        <div className="diff-stats">
          <span>{stats.words} words</span>
          <span>{stats.lines} lines</span>
          <span>{stats.characters} chars</span>
        </div>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyOutput}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={downloadOutput}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>

        <p className="helper-text">{message || 'Create placeholder content for layouts, forms, and drafts.'}</p>
      </section>

      <section className="lorem-output">
        <textarea className="text-cleaner-textarea output" value={output} readOnly />
      </section>
    </div>
  )
}
