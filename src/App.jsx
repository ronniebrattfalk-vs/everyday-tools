import { Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Search, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { AuthControls } from './components/AuthControls.jsx'
import { ToolCard } from './components/ToolCard.jsx'
import { useAuth } from './context/auth.js'
import { registeredTools as tools } from './data/toolRegistry.jsx'
import { useFavoriteTools } from './hooks/useFavoriteTools.js'
import { readLocalDefaultTool, useToolSettings } from './hooks/useToolSettings.js'
import './App.css'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const recentToolsKey = 'everyday-tools:recent-tools'

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
  const { user } = useAuth()
  const [activeTool, setActiveTool] = useState(initialTool)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sortMode, setSortMode] = useState('recent')
  const [recentTools, setRecentTools] = useState(() => {
    const initial = initialTool()
    return [initial, ...readRecentTools().filter((slug) => slug !== initial)].slice(0, 12)
  })
  const { favoriteSet, favoritesMessage, toggleFavorite } = useFavoriteTools(user)
  const { defaultToolSlug, settingsMessage, setDefaultTool } = useToolSettings(user)

  const categories = useMemo(
    () => ['All', 'Favorites', ...Array.from(new Set(tools.map((tool) => tool.category)))],
    [],
  )

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
  const plannedCount = tools.length - liveCount

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
        <div className="topbar-actions">
          <div className="topbar-stats" aria-label="Product status">
            <span>{liveCount} live</span>
            {plannedCount > 0 && <span>{plannedCount} planned</span>}
            <span>Login optional</span>
          </div>
          <AuthControls />
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

          <div className="category-tabs compact" aria-label="Tool sorting">
            <button type="button" className={sortMode === 'recent' ? 'is-active' : ''} onClick={() => setSortMode('recent')}>
              Recent
            </button>
            <button type="button" className={sortMode === 'az' ? 'is-active' : ''} onClick={() => setSortMode('az')}>
              A-Z
            </button>
          </div>

          <div className="tool-grid" aria-label="Tool list">
            {visibleTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                icon={tool.iconComponent}
                isActive={tool.slug === selectedTool.slug}
                isFavorite={favoriteSet.has(tool.slug)}
                onSelect={() => selectTool(tool.slug)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
            {visibleTools.length === 0 && (
              <div className="sidebar-empty">
                <p>{category === 'Favorites' ? 'No favorite tools yet.' : 'No tools match your search.'}</p>
              </div>
            )}
          </div>
          {(favoritesMessage || settingsMessage) && (
            <div className="sidebar-notes">
              {favoritesMessage && <p>{favoritesMessage}</p>}
              {settingsMessage && <p>{settingsMessage}</p>}
            </div>
          )}
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
        </section>
      </section>
    </main>
  )
}

export default App
