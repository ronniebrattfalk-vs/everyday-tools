import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import html from 'highlight.js/lib/languages/xml'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import yaml from 'highlight.js/lib/languages/yaml'
import { Marked } from 'marked'
import { Clipboard, Code2, Download, FileText, RotateCcw } from 'lucide-react'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', html)
hljs.registerLanguage('xml', html)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)

const markdownRenderer = {
  code({ text, lang }) {
    const normalized = lang?.trim().toLowerCase() || ''
    const hasExplicitLanguage = normalized && hljs.getLanguage(normalized)
    const highlighted = hasExplicitLanguage
      ? hljs.highlight(text, { language: normalized, ignoreIllegals: true }).value
      : hljs.highlightAuto(text).value
    const label = hasExplicitLanguage ? normalized : 'auto'

    return `<div class="markdown-code-block"><div class="markdown-code-label">${label}</div><pre><code class="hljs language-${label}">${highlighted}</code></pre></div>`
  },
}

const markdownParser = new Marked({
  breaks: true,
  gfm: true,
  renderer: markdownRenderer,
})

const sampleMarkdown = `# Everyday Tools

Fast, private tools for everyday work.

## Highlights

- Browser-first utilities
- No login required
- Local file processing by default

\`\`\`js
const tools = ['JSON Formatter', 'Markdown Previewer', 'PDF Tools']
console.log(tools.join(' | '))
\`\`\`

**Next:** keep adding focused tools that solve small daily jobs well.
`

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState(sampleMarkdown)
  const [message, setMessage] = useState('')

  const html = useMemo(
    () => DOMPurify.sanitize(markdownParser.parse(markdown), { USE_PROFILES: { html: true } }),
    [markdown],
  )
  const stats = useMemo(
    () => ({
      words: countWords(markdown),
      characters: markdown.length,
      lines: markdown ? markdown.split('\n').length : 0,
    }),
    [markdown],
  )

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown)
    setMessage('Markdown copied')
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html)
    setMessage('HTML copied')
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'document.md'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Markdown downloaded')
  }

  function resetMarkdown() {
    setMarkdown(sampleMarkdown)
    setMessage('Reset to sample Markdown')
  }

  return (
    <div className="tool-body markdown-tool">
      <div className="markdown-toolbar">
        <div className="diff-stats" aria-live="polite">
          <span>{stats.words} words</span>
          <span>{stats.lines} lines</span>
          <span>{stats.characters} chars</span>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={copyMarkdown} disabled={!markdown.trim()}>
            <Clipboard size={17} aria-hidden="true" />
            Copy MD
          </button>
          <button type="button" className="secondary-button" onClick={copyHtml} disabled={!html.trim()}>
            <Code2 size={17} aria-hidden="true" />
            Copy HTML
          </button>
          <button type="button" className="secondary-button" onClick={downloadMarkdown} disabled={!markdown.trim()}>
            <Download size={17} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="secondary-button" onClick={resetMarkdown}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="markdown-grid">
        <label className="markdown-editor">
          Markdown
          <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
        </label>

        <section className="markdown-preview-panel" aria-label="Markdown preview">
          <div className="json-output-title">
            <h3>Preview</h3>
            <span className="json-stat">{message || 'Sanitized HTML preview with syntax highlighting'}</span>
          </div>
          {html ? (
            <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="empty-state">
              <FileText size={28} aria-hidden="true" />
              <p>Preview appears as you type.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
