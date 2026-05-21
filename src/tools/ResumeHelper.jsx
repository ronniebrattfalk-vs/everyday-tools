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
