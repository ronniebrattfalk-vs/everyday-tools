import { Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight, Briefcase, Code2, FileStack, LayoutGrid,
  Moon, Newspaper, Palette, PenLine, Search,
  ShieldCheck, Sparkles, Star, Sun, Zap,
} from 'lucide-react'
import { ToolCard } from './components/ToolCard.jsx'
import { WhatsNewModal } from './components/WhatsNewModal.jsx'
import { registeredTools as tools } from './data/toolRegistry.jsx'
import { useFavoriteTools } from './hooks/useFavoriteTools.js'
import { readLocalDefaultTool, useToolSettings } from './hooks/useToolSettings.js'
import { VERSION } from './version.js'
import './App.css'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const recentToolsKey = 'everyday-tools:recent-tools'
const themeKey = 'everyday-tools:theme'

const CATEGORY_CONFIG = {
  All:       { icon: LayoutGrid,  color: '#7c6ef4' },
  Favorites: { icon: Star,        color: '#f59e0b' },
  Everyday:  { icon: Zap,         color: '#22d3ee' },
  Security:  { icon: ShieldCheck, color: '#a78bfa' },
  Developer: { icon: Code2,       color: '#60a5fa' },
  Writing:   { icon: PenLine,     color: '#4ade80' },
  Design:    { icon: Palette,     color: '#f472b6' },
  Business:  { icon: Briefcase,   color: '#fbbf24' },
  Documents: { icon: FileStack,   color: '#fb923c' },
}

function toolFromPath() {
  const path = basePath && window.location.pathname.startsWith(basePath)
    ? window.location.pathname.slice(basePath.length)
    : window.location.pathname
  const slug = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return tools.some((tool) => tool.slug === slug) ? slug : null
}

function initialTool() {
  return toolFromPath() || readLocalDefaultTool() || 'qr-code'
}

function readRecentTools() {
  try {
    const parsed = JSON.parse(localStorage.getItem(recentToolsKey) || '[]')
    return Array.isArray(parsed) ? parsed.filter((slug) => tools.some((tool) => tool.slug === slug)).slice(0, 12) : []
  } catch {
    return []
  }
}

function App() {
  const [activeTool, setActiveTool] = useState(initialTool)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sortMode, setSortMode] = useState('recent')
  const [recentTools, setRecentTools] = useState(() => {
    const initial = initialTool()
    return [initial, ...readRecentTools().filter((slug) => slug !== initial)].slice(0, 12)
  })
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem(themeKey) || 'dark')
  const { favoriteSet, favoritesMessage, toggleFavorite } = useFavoriteTools()
  const { defaultToolSlug, settingsMessage, setDefaultTool } = useToolSettings()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(themeKey, theme)
  }, [theme])

  const categories = useMemo(
    () => ['All', 'Favorites', ...Array.from(new Set(tools.map((tool) => tool.category)))],
    [],
  )

  const categoryCounts = useMemo(() => {
    const m = {}
    for (const t of tools) m[t.category] = (m[t.category] || 0) + 1
    return m
  }, [])

  const visibleTools = useMemo(() => {
    const recentRank = new Map(recentTools.map((slug, index) => [slug, index]))
    return tools
      .filter((tool) => {
        const matchesCategory =
          category === 'All' || (category === 'Favorites' ? favoriteSet.has(tool.slug) : tool.category === category)
        const haystack = `${tool.name} ${tool.category} ${tool.description}`.toLowerCase()
        return matchesCategory && haystack.includes(query.trim().toLowerCase())
      })
      .toSorted((first, second) => {
        if (sortMode === 'recent') {
          const firstRank = recentRank.has(first.slug) ? recentRank.get(first.slug) : Number.POSITIVE_INFINITY
          const secondRank = recentRank.has(second.slug) ? recentRank.get(second.slug) : Number.POSITIVE_INFINITY
          if (firstRank !== secondRank) return firstRank - secondRank
        }
        return first.name.localeCompare(second.name) || first.roadmapOrder - second.roadmapOrder
      })
  }, [category, favoriteSet, query, recentTools, sortMode])

  const selectedSlug = toolFromPath() || defaultToolSlug || activeTool
  const selectedTool = tools.find((tool) => tool.slug === selectedSlug) ?? tools[0]
  const ActiveTool = selectedTool.component
  const liveCount = tools.filter((tool) => tool.status === 'Live').length

  function recordRecentTool(slug) {
    setRecentTools((current) => {
      const next = [slug, ...current.filter((item) => item !== slug)].slice(0, 12)
      localStorage.setItem(recentToolsKey, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    function handlePopState() {
      const nextTool = toolFromPath() || defaultToolSlug || 'qr-code'
      setActiveTool(nextTool)
      recordRecentTool(nextTool)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [defaultToolSlug])

  useEffect(() => {
    document.title = `${selectedTool.name} - Everyday Tools`
  }, [selectedTool.name])

  function selectTool(slug) {
    setActiveTool(slug)
    recordRecentTool(slug)
    const nextPath = `${basePath}/${slug}`
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <>
      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
      <div className="app-shell">

        {/* ── SIDEBAR ── */}
        <aside className="app-sidebar">
          <div className="sb-logo">
            <div className="sb-logo-icon">⚙</div>
            <div>
              <div className="sb-logo-name">Everyday Tools</div>
              <div className="sb-logo-ver">v{VERSION}</div>
            </div>
          </div>

          <div className="sb-search">
            <Search size={13} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              aria-label="Search tools"
            />
          </div>

          <div className="sb-section">Browse</div>
          <nav className="sb-nav" aria-label="Tool categories">
            {categories.map((cat) => {
              const meta = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.All
              const CatIcon = meta.icon
              const count = cat === 'All' ? liveCount : cat === 'Favorites' ? favoriteSet.size : categoryCounts[cat]
              const isActive = category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  className={`sb-item${isActive ? ' active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <span
                    className="sb-item-icon"
                    style={isActive
                      ? { background: `${meta.color}20`, color: meta.color }
                      : {}}
                  >
                    <CatIcon size={13} aria-hidden="true" />
                  </span>
                  <span className="sb-label">{cat}</span>
                  {count !== undefined && <span className="sb-count">{count}</span>}
                </button>
              )
            })}
          </nav>

          {(favoritesMessage || settingsMessage) && (
            <div className="sb-notes">
              {favoritesMessage && <p>{favoritesMessage}</p>}
              {settingsMessage && <p>{settingsMessage}</p>}
            </div>
          )}

          <div className="sb-footer">
            <button type="button" className="sb-item" onClick={() => setShowWhatsNew(true)}>
              <span className="sb-item-icon"><Newspaper size={13} aria-hidden="true" /></span>
              <span className="sb-label">What's New</span>
            </button>
          </div>
        </aside>

        {/* ── TOOL LIST PANEL ── */}
        <div className="tool-list-panel">
          <div className="tlp-header">
            <span className="tlp-title">Tools</span>
            <div className="sb-sort">
              <button
                type="button"
                className={sortMode === 'recent' ? 'on' : ''}
                onClick={() => setSortMode('recent')}
              >Recent</button>
              <button
                type="button"
                className={sortMode === 'az' ? 'on' : ''}
                onClick={() => setSortMode('az')}
              >A–Z</button>
            </div>
          </div>
          <div className="tlp-list" aria-label="Tool list">
            {visibleTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                icon={tool.iconComponent}
                isActive={tool.slug === selectedTool.slug}
                isFavorite={favoriteSet.has(tool.slug)}
                onSelect={() => selectTool(tool.slug)}
                onToggleFavorite={toggleFavorite}
                categoryColor={CATEGORY_CONFIG[tool.category]?.color ?? '#7c6ef4'}
              />
            ))}
            {visibleTools.length === 0 && (
              <div className="sb-empty">
                <p>{category === 'Favorites' ? 'No favorite tools yet.' : 'No tools match your search.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="app-main">
          <div className="app-topbar">
            <div className="topbar-crumb">
              <span>Tools</span>
              <span className="crumb-sep">›</span>
              <b>{selectedTool.category}</b>
              <span className="crumb-sep">›</span>
              <b>{selectedTool.name}</b>
            </div>
            <div className="topbar-right">
              <div className="topbar-stats" aria-label="Product status">
                <span>{liveCount} live</span>
                <span className="version-badge">v{VERSION}</span>
              </div>
              <button type="button" className="topbar-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark'
                  ? <Sun size={14} aria-hidden="true" />
                  : <Moon size={14} aria-hidden="true" />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <span className="privacy-pill">
                <ArrowLeftRight size={13} aria-hidden="true" />
                Local in browser
              </span>
            </div>
          </div>

          <div className="app-content">
            <div className="tool-panel-header">
              <div>
                <p className="eyebrow">
                  <Sparkles size={15} aria-hidden="true" />
                  {selectedTool.status}
                </p>
                <h2 id="active-tool-title">{selectedTool.name}</h2>
                <p>{selectedTool.description}</p>
              </div>
            </div>
            <div className="tool-panel-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDefaultTool(selectedTool.slug)}
                disabled={defaultToolSlug === selectedTool.slug}
              >
                <Star size={16} aria-hidden="true" />
                {defaultToolSlug === selectedTool.slug ? 'Default tool' : 'Set as default'}
              </button>
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
          </div>
        </div>

      </div>
    </>
  )
}

export default App
