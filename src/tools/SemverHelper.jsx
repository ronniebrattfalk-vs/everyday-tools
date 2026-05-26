import { useMemo, useState } from 'react'
import { Clipboard } from 'lucide-react'

function parseSemver(input) {
  const str = input.trim().replace(/^v/, '')
  const match = str.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/)
  if (!match) return null
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
    build: match[5] || '',
    raw: str,
  }
}

function compareSemver(a, b) {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1
  if (!a.prerelease && b.prerelease) return 1
  if (a.prerelease && !b.prerelease) return -1
  if (a.prerelease && b.prerelease) {
    return a.prerelease < b.prerelease ? -1 : a.prerelease > b.prerelease ? 1 : 0
  }
  return 0
}

function bumpVersion(p, type) {
  if (type === 'major') return `${p.major + 1}.0.0`
  if (type === 'minor') return `${p.major}.${p.minor + 1}.0`
  return `${p.major}.${p.minor}.${p.patch + 1}`
}

function VersionBreakdown({ parsed }) {
  const parts = [
    ['Major', parsed.major],
    ['Minor', parsed.minor],
    ['Patch', parsed.patch],
    ...(parsed.prerelease ? [['Pre-release', parsed.prerelease]] : []),
    ...(parsed.build ? [['Build', parsed.build]] : []),
  ]
  return (
    <div className="semver-breakdown">
      {parts.map(([label, value]) => (
        <article key={label} className="semver-part">
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  )
}

export function SemverHelper() {
  const [versionA, setVersionA] = useState('1.4.2')
  const [versionB, setVersionB] = useState('2.0.0-beta.1')
  const [message, setMessage] = useState('')

  const parsedA = useMemo(() => parseSemver(versionA), [versionA])
  const parsedB = useMemo(() => parseSemver(versionB), [versionB])

  const comparison = useMemo(() => {
    if (!parsedA || !parsedB) return null
    const result = compareSemver(parsedA, parsedB)
    if (result > 0) return { symbol: '>', label: `${parsedA.raw} is greater than ${parsedB.raw}` }
    if (result < 0) return { symbol: '<', label: `${parsedA.raw} is less than ${parsedB.raw}` }
    return { symbol: '=', label: 'Both versions are equal' }
  }, [parsedA, parsedB])

  async function copy(text) {
    await navigator.clipboard.writeText(text)
    setMessage(`${text} copied`)
    setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div className="tool-body semver-tool">
      <div className="semver-controls">
        <div className="section-title-row">
          <h3>Version A</h3>
        </div>

        <label>
          Semver string
          <input
            value={versionA}
            onChange={(e) => setVersionA(e.target.value)}
            placeholder="1.2.3"
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        {parsedA ? (
          <VersionBreakdown parsed={parsedA} />
        ) : (
          versionA.trim() && <p className="helper-text semver-error">Not a valid semver string.</p>
        )}

        <h3>Bump Version A</h3>

        {parsedA ? (
          <div className="semver-bumps">
            {['patch', 'minor', 'major'].map((type) => {
              const bumped = bumpVersion(parsedA, type)
              return (
                <article key={type} className="semver-bump-card">
                  <div>
                    <span>{type}</span>
                    <strong>{bumped}</strong>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => copy(bumped)}
                    aria-label={`Copy ${type} bump`}
                  >
                    <Clipboard size={16} aria-hidden="true" />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Enter a valid version above to see bump options.</p>
          </div>
        )}
      </div>

      <div className="semver-results">
        <div className="section-title-row">
          <h3>Compare</h3>
        </div>

        <label>
          Version B
          <input
            value={versionB}
            onChange={(e) => setVersionB(e.target.value)}
            placeholder="2.0.0"
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        {parsedB ? (
          <VersionBreakdown parsed={parsedB} />
        ) : (
          versionB.trim() && <p className="helper-text semver-error">Not a valid semver string.</p>
        )}

        {comparison && (
          <div className="semver-compare-result">
            <span className="semver-compare-symbol" aria-hidden="true">{comparison.symbol}</span>
            <p>{comparison.label}</p>
          </div>
        )}

        <p className="helper-text">
          {message || 'Leading v is stripped. Pre-release ordering follows the semver spec: 1.0.0 > 1.0.0-rc.1.'}
        </p>
      </div>
    </div>
  )
}
