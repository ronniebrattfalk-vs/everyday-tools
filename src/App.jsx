import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Braces,
  BriefcaseBusiness,
  Clock3,
  FileText,
  FileUp,
  KeyRound,
  QrCode,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { ToolCard } from './components/ToolCard.jsx'
import { tools } from './data/tools.js'
import './App.css'

const QRCodeTool = lazy(() => import('./tools/QRCodeTool.jsx').then((module) => ({ default: module.QRCodeTool })))
const PasswordGenerator = lazy(() =>
  import('./tools/PasswordGenerator.jsx').then((module) => ({ default: module.PasswordGenerator })),
)
const UnitConverter = lazy(() => import('./tools/UnitConverter.jsx').then((module) => ({ default: module.UnitConverter })))
const TimestampConverter = lazy(() =>
  import('./tools/TimestampConverter.jsx').then((module) => ({ default: module.TimestampConverter })),
)
const JSONFormatter = lazy(() =>
  import('./tools/JSONFormatter.jsx').then((module) => ({ default: module.JSONFormatter })),
)
const InvoiceGenerator = lazy(() =>
  import('./tools/InvoiceGenerator.jsx').then((module) => ({ default: module.InvoiceGenerator })),
)
const ResumeHelper = lazy(() => import('./tools/ResumeHelper.jsx').then((module) => ({ default: module.ResumeHelper })))
const PDFTools = lazy(() => import('./tools/PDFTools.jsx').then((module) => ({ default: module.PDFTools })))

const iconMap = {
  qr: QrCode,
  password: KeyRound,
  ruler: Ruler,
  clock: Clock3,
  json: Braces,
  invoice: BriefcaseBusiness,
  resume: FileText,
  pdf: FileUp,
}

const toolComponents = {
  'qr-code': QRCodeTool,
  password: PasswordGenerator,
  'unit-converter': UnitConverter,
  timestamp: TimestampConverter,
  'json-formatter': JSONFormatter,
  'invoice-generator': InvoiceGenerator,
  'resume-helper': ResumeHelper,
  'pdf-tools': PDFTools,
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

function toolFromPath() {
  const path = basePath && window.location.pathname.startsWith(basePath)
    ? window.location.pathname.slice(basePath.length)
    : window.location.pathname
  const slug = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return tools.some((tool) => tool.slug === slug) ? slug : 'qr-code'
}

function App() {
  const [activeTool, setActiveTool] = useState(toolFromPath)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(tools.map((tool) => tool.category)))],
    [],
  )

  const visibleTools = tools.filter((tool) => {
    const matchesCategory = category === 'All' || tool.category === category
    const haystack = `${tool.name} ${tool.category} ${tool.description}`.toLowerCase()
    return matchesCategory && haystack.includes(query.trim().toLowerCase())
  })

  const selectedTool = tools.find((tool) => tool.slug === activeTool) ?? tools[0]
  const ActiveTool = toolComponents[selectedTool.slug]
  const liveCount = tools.filter((tool) => tool.status === 'Live').length
  const plannedCount = tools.length - liveCount

  useEffect(() => {
    function handlePopState() {
      setActiveTool(toolFromPath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.title = `${selectedTool.name} - Everyday Tools`
  }, [selectedTool.name])

  function selectTool(slug) {
    setActiveTool(slug)
    const nextPath = `${basePath}/${slug}`
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            <ShieldCheck size={16} aria-hidden="true" />
            Browser-first utilities
          </p>
          <h1>Fast, private tools for everyday work.</h1>
        </div>
        <div className="topbar-stats" aria-label="Product status">
          <span>{liveCount} live</span>
          <span>{plannedCount} planned</span>
          <span>No signup</span>
        </div>
      </header>

      <section className="workspace" aria-label="Everyday tools workspace">
        <aside className="tool-sidebar">
          <div className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools"
              aria-label="Search tools"
            />
          </div>

          <div className="category-tabs" aria-label="Tool categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={item === category ? 'is-active' : ''}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="tool-grid" aria-label="Tool list">
            {visibleTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                icon={iconMap[tool.icon]}
                isActive={tool.slug === selectedTool.slug}
                onSelect={() => selectTool(tool.slug)}
              />
            ))}
          </div>
        </aside>

        <section className="tool-panel" aria-labelledby="active-tool-title">
          <div className="tool-panel-header">
            <div>
              <p className="eyebrow">
                <Sparkles size={16} aria-hidden="true" />
                {selectedTool.status}
              </p>
              <h2 id="active-tool-title">{selectedTool.name}</h2>
              <p>{selectedTool.description}</p>
            </div>
            <span className="privacy-pill">
              <ArrowLeftRight size={15} aria-hidden="true" />
              Local in browser
            </span>
          </div>

          {ActiveTool ? (
            <Suspense fallback={<div className="tool-loading">Loading tool...</div>}>
              <ActiveTool />
            </Suspense>
          ) : (
            <div className="roadmap-panel">
              <p className="roadmap-rank">Roadmap item {selectedTool.roadmapOrder}</p>
              <h3>{selectedTool.name} is planned next.</h3>
              <p>{selectedTool.roadmap}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
