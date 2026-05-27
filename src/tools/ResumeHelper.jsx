import { useMemo, useState } from 'react'
import { Clipboard, RotateCcw, Wand2 } from 'lucide-react'

const initialProfile = {
  name: 'Alex Andersson',
  targetRole: 'Operations Coordinator',
  experience: '5 years',
  strengths: 'process improvement, supplier communication, Excel reporting',
  achievements: 'reduced manual follow-up time by 30%, coordinated weekly partner updates, improved order tracking routines',
  tone: 'Professional',
  company: 'the company',
}

const weakVerbs = ['helped', 'worked', 'responsible for', 'assisted', 'supported', 'handled', 'did']

const STRONG_VERB_MAP = {
  'helped':           ['drove', 'contributed to', 'advanced'],
  'worked':           ['delivered', 'executed', 'led'],
  'responsible for':  ['owned', 'managed', 'oversaw'],
  'assisted':         ['enabled', 'facilitated', 'accelerated'],
  'supported':        ['strengthened', 'enabled', 'advanced'],
  'handled':          ['managed', 'directed', 'executed'],
  'did':              ['achieved', 'delivered', 'completed'],
}

function sentenceList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinHuman(items) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

function detectPassive(sentence) {
  return /\b(?:was|were|is|are|been|be|being)\s+\w+(?:ed|en)\b/i.test(sentence)
}

function suggestRewrite(achievement, foundWeakVerbs, isPassive, hasMetric) {
  if (!foundWeakVerbs.length && !isPassive && hasMetric) return null

  let text = achievement

  if (foundWeakVerbs.length) {
    const verb = foundWeakVerbs[0]
    const alternatives = STRONG_VERB_MAP[verb]
    if (alternatives) {
      text = text.replace(new RegExp(`\\b${verb}\\b`, 'i'), alternatives[0])
    }
  }

  const metricHint = !hasMetric ? ' (add a number, e.g. "15%", "3 clients", "$10k")' : ''

  return `${text}${metricHint}`
}

function analyzeAchievements(achievements) {
  return achievements.map((achievement) => {
    const lower = achievement.toLowerCase()
    const words = achievement.match(/\b[\w%-]+\b/g) ?? []
    const foundWeakVerbs = weakVerbs.filter((verb) => lower.includes(verb))
    const isPassive = detectPassive(achievement)
    const hasMetric = /\b\d+(?:[%.,]\d+)?\b/.test(achievement)
    const tooLong = words.length > 18
    return {
      text: achievement,
      weakVerbs: foundWeakVerbs,
      passive: isPassive,
      hasMetric,
      tooLong,
      suggestion: suggestRewrite(achievement, foundWeakVerbs, isPassive, hasMetric),
    }
  })
}

function buildOutputs(profile) {
  const strengths = joinHuman(sentenceList(profile.strengths))
  const achievements = sentenceList(profile.achievements)
  const achievementText = achievements.length
    ? `Highlights include ${joinHuman(achievements)}.`
    : 'Known for steady delivery, clear communication, and practical problem solving.'

  const summary = `${profile.targetRole} with ${profile.experience} of experience across ${strengths || 'cross-functional work'}. ${achievementText} Brings a structured, reliable approach and focuses on work that improves daily operations for teams and customers.`

  const bullets = achievements.length
    ? achievements.map((achievement) => `- ${achievement.charAt(0).toUpperCase()}${achievement.slice(1)}`)
    : [
        '- Improved team routines with clearer follow-up and documentation',
        '- Coordinated stakeholders to keep daily work moving smoothly',
        '- Turned recurring issues into practical process improvements',
      ]

  const coverLetter = `Hi ${profile.company || 'there'},\n\nI am interested in the ${profile.targetRole} role because it matches the kind of work I do best: organizing moving parts, communicating clearly, and improving practical workflows. My ${profile.experience} of experience has given me a strong foundation in ${strengths || 'structured daily operations'}.\n\n${achievementText} I would bring the same dependable, improvement-focused approach to your team.\n\nBest regards,\n${profile.name || 'Your Name'}`

  const linkedin = `${profile.targetRole} | ${strengths || 'Operations, coordination, and process improvement'} | ${profile.experience} experience`

  return {
    summary,
    bullets: bullets.join('\n'),
    coverLetter,
    linkedin,
  }
}

export function ResumeHelper() {
  const [profile, setProfile] = useState(initialProfile)
  const [activeOutput, setActiveOutput] = useState('summary')
  const [message, setMessage] = useState('')

  const outputs = useMemo(() => buildOutputs(profile), [profile])
  const achievementAnalysis = useMemo(() => analyzeAchievements(sentenceList(profile.achievements)), [profile.achievements])
  const analysisSummary = useMemo(() => {
    const weak = achievementAnalysis.filter((item) => item.weakVerbs.length > 0).length
    const passive = achievementAnalysis.filter((item) => item.passive).length
    const missingMetrics = achievementAnalysis.filter((item) => !item.hasMetric).length
    const longBullets = achievementAnalysis.filter((item) => item.tooLong).length
    return { weak, passive, missingMetrics, longBullets }
  }, [achievementAnalysis])

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setMessage('')
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(outputs[activeOutput])
    setMessage('Copied output')
  }

  function resetProfile() {
    setProfile(initialProfile)
    setActiveOutput('summary')
    setMessage('Reset to sample profile')
  }

  return (
    <div className="tool-body resume-helper">
      <section className="resume-form">
        <div className="form-grid">
          <label>
            Name
            <input value={profile.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            Target role
            <input value={profile.targetRole} onChange={(event) => updateField('targetRole', event.target.value)} />
          </label>
          <label>
            Experience
            <input value={profile.experience} onChange={(event) => updateField('experience', event.target.value)} />
          </label>
          <label>
            Company / recipient
            <input value={profile.company} onChange={(event) => updateField('company', event.target.value)} />
          </label>
        </div>

        <label>
          Strengths
          <textarea
            value={profile.strengths}
            onChange={(event) => updateField('strengths', event.target.value)}
            placeholder="Separate strengths with commas"
          />
        </label>

        <label>
          Achievements
          <textarea
            value={profile.achievements}
            onChange={(event) => updateField('achievements', event.target.value)}
            placeholder="Separate achievements with commas"
          />
        </label>

        <label>
          Tone
          <select value={profile.tone} onChange={(event) => updateField('tone', event.target.value)}>
            <option>Professional</option>
            <option>Confident</option>
            <option>Friendly</option>
            <option>Concise</option>
          </select>
        </label>
      </section>

      <section className="resume-output-panel">
        <div className="section-title-row">
          <div>
            <h3>Generated Text</h3>
            <p className="helper-text">Template-based output. No account or AI service required.</p>
          </div>
          <Wand2 size={24} aria-hidden="true" />
        </div>

        <div className="category-tabs compact" aria-label="Resume helper outputs">
          {[
            ['summary', 'Summary'],
            ['bullets', 'Bullets'],
            ['coverLetter', 'Cover letter'],
            ['linkedin', 'LinkedIn'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeOutput === key ? 'is-active' : ''}
              onClick={() => setActiveOutput(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="writing-results resume-analysis-grid">
          <article>
            <span>Weak verbs</span>
            <strong>{analysisSummary.weak}</strong>
            <p>Replace vague verbs like "helped" with stronger actions.</p>
          </article>
          <article>
            <span>Passive</span>
            <strong>{analysisSummary.passive}</strong>
            <p>Active voice usually reads stronger in resume bullets.</p>
          </article>
          <article>
            <span>Missing metrics</span>
            <strong>{analysisSummary.missingMetrics}</strong>
            <p>Add numbers, percentages, time saved, or volume when possible.</p>
          </article>
          <article>
            <span>Long bullets</span>
            <strong>{analysisSummary.longBullets}</strong>
            <p>Keep bullets tight so impact is easier to scan quickly.</p>
          </article>
        </div>

        {achievementAnalysis.length > 0 && (
          <div className="resume-bullet-review">
            <p className="field-label" style={{ marginBottom: 8 }}>Bullet review</p>
            {achievementAnalysis.map((item, i) => {
              const issues = []
              if (item.weakVerbs.length) issues.push(`weak verb: ${item.weakVerbs[0]}`)
              if (item.passive) issues.push('passive voice')
              if (!item.hasMetric) issues.push('no metric')
              if (item.tooLong) issues.push('too long')
              const clean = issues.length === 0
              return (
                <div key={i} className={`resume-bullet-card ${clean ? 'resume-bullet-card--ok' : ''}`}>
                  <div className="resume-bullet-original">
                    <span className="resume-bullet-label">{clean ? '✓ Strong' : 'Original'}</span>
                    <span className="resume-bullet-text">{item.text}</span>
                    {!clean && (
                      <div className="resume-bullet-tags">
                        {issues.map((issue, j) => (
                          <span key={j} className="resume-bullet-tag">{issue}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.suggestion && (
                    <div className="resume-bullet-suggestion">
                      <span className="resume-bullet-label resume-bullet-label--suggest">Suggested</span>
                      <span className="resume-bullet-text">{item.suggestion}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <textarea className="resume-output" value={outputs[activeOutput]} readOnly />

        <div className="button-row">
          <button type="button" className="primary-button" onClick={copyOutput}>
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" className="secondary-button" onClick={resetProfile}>
            <RotateCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
        <p className="helper-text">{message || 'Edit the fields and the text updates instantly.'}</p>
      </section>
    </div>
  )
}
