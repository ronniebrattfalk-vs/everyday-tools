import { useMemo, useState } from 'react'
import semver from 'semver'
import { Clipboard } from 'lucide-react'

function parseVersionList(value) {
  return Array.from(new Set(value.split(/[\s,]+/).map((item) => semver.valid(item)).filter(Boolean)))
}

function VersionBreakdown({ parsed }) {
  const parts = [
    ['Major', parsed.major],
    ['Minor', parsed.minor],
    ['Patch', parsed.patch],
    ['Version', parsed.version],
    ['Pre-release', parsed.prerelease.length ? parsed.prerelease.join('.') : '—'],
    ['Build', parsed.build.length ? parsed.build.join('.') : '—'],
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
  const [rangeInput, setRangeInput] = useState('^1.4.0 || 2.0.0-beta.1')
  const [candidateInput, setCandidateInput] = useState('1.4.0\n1.4.2\n1.5.0\n2.0.0-beta.1\n2.0.0')
  const [message, setMessage] = useState('')

  const parsedA = useMemo(() => semver.parse(versionA), [versionA])
  const parsedB = useMemo(() => semver.parse(versionB), [versionB])
  const cleanedA = useMemo(() => semver.valid(versionA), [versionA])
  const cleanedB = useMemo(() => semver.valid(versionB), [versionB])
  const validRange = useMemo(() => semver.validRange(rangeInput), [rangeInput])
  const candidates = useMemo(() => parseVersionList(candidateInput), [candidateInput])

  const comparison = useMemo(() => {
    if (!cleanedA || !cleanedB) return null
    const result = semver.compare(cleanedA, cleanedB)
    if (result > 0) return { symbol: '>', label: `${cleanedA} is greater than ${cleanedB}` }
    if (result < 0) return { symbol: '<', label: `${cleanedA} is less than ${cleanedB}` }
    return { symbol: '=', label: 'Both versions are equal' }
  }, [cleanedA, cleanedB])

  const rangeSummary = useMemo(() => {
    if (!validRange) return null

    return {
      comparators: semver.toComparators(validRange).map((group) => group.join(' ')).join(' || '),
      aMatches: cleanedA ? semver.satisfies(cleanedA, validRange, { includePrerelease: true }) : false,
      bMatches: cleanedB ? semver.satisfies(cleanedB, validRange, { includePrerelease: true }) : false,
      maxMatch: semver.maxSatisfying(candidates, validRange, { includePrerelease: true }) || 'None',
      minMatch: semver.minSatisfying(candidates, validRange, { includePrerelease: true }) || 'None',
      minVersion: semver.minVersion(validRange)?.version || 'Unknown',
    }
  }, [candidates, cleanedA, cleanedB, validRange])

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
            onChange={(event) => setVersionA(event.target.value)}
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

        {cleanedA ? (
          <div className="semver-bumps">
            {['patch', 'minor', 'major', 'prerelease'].map((type) => {
              const bumped = semver.inc(cleanedA, type, 'beta')
              return (
                <article key={type} className="semver-bump-card">
                  <div>
                    <span>{type}</span>
                    <strong>{bumped || 'Unavailable'}</strong>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => bumped && copy(bumped)}
                    aria-label={`Copy ${type} bump`}
                    disabled={!bumped}
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
          <h3>Compare And Ranges</h3>
        </div>

        <label>
          Version B
          <input
            value={versionB}
            onChange={(event) => setVersionB(event.target.value)}
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

        <label>
          Range
          <input
            value={rangeInput}
            onChange={(event) => setRangeInput(event.target.value)}
            placeholder="^1.0.0 || >=2.0.0 <3.0.0"
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        <label>
          Candidate versions
          <textarea
            className="request-snippet"
            value={candidateInput}
            onChange={(event) => setCandidateInput(event.target.value)}
            spellCheck={false}
            placeholder="One version per line or separated by commas"
          />
        </label>

        {validRange ? (
          <div className="semver-range-grid">
            <article className="semver-part">
              <span>Valid range</span>
              <strong>{validRange}</strong>
            </article>
            <article className="semver-part">
              <span>Comparators</span>
              <strong>{rangeSummary?.comparators || '—'}</strong>
            </article>
            <article className="semver-part">
              <span>Min version</span>
              <strong>{rangeSummary?.minVersion || '—'}</strong>
            </article>
            <article className={`semver-part ${rangeSummary?.aMatches ? 'passes' : 'fails'}`}>
              <span>Version A satisfies</span>
              <strong>{rangeSummary?.aMatches ? 'Yes' : 'No'}</strong>
            </article>
            <article className={`semver-part ${rangeSummary?.bMatches ? 'passes' : 'fails'}`}>
              <span>Version B satisfies</span>
              <strong>{rangeSummary?.bMatches ? 'Yes' : 'No'}</strong>
            </article>
            <article className="semver-part">
              <span>Max satisfying</span>
              <strong>{rangeSummary?.maxMatch || 'None'}</strong>
            </article>
            <article className="semver-part">
              <span>Min satisfying</span>
              <strong>{rangeSummary?.minMatch || 'None'}</strong>
            </article>
            <article className="semver-part">
              <span>Valid candidates</span>
              <strong>{candidates.length}</strong>
            </article>
          </div>
        ) : (
          rangeInput.trim() && <p className="helper-text semver-error">Not a valid semver range.</p>
        )}

        <p className="helper-text">
          {message || 'Powered by the canonical semver package, including prerelease-aware comparisons and range checks.'}
        </p>
      </div>
    </div>
  )
}
