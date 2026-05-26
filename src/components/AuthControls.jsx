import { useMemo, useState } from 'react'
import { LogIn, LogOut, Mail, UserRound, X } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { useAuth } from '../context/auth.js'

const socialProviders = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'github', label: 'GitHub' },
  { id: 'apple', label: 'Apple' },
  { id: 'azure', label: 'Microsoft' },
  { id: 'linkedin_oidc', label: 'LinkedIn' },
]

function getRedirectUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

function getUserLabel(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Signed in'
}

export function AuthControls() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  const userLabel = useMemo(() => getUserLabel(user), [user])

  async function sendMagicLink(event) {
    event.preventDefault()
    if (!supabase || !email.trim()) return

    setIsWorking(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    })

    setIsWorking(false)
    setMessage(error ? error.message : 'Check your email for the sign-in link.')
  }

  async function signInWithProvider(provider) {
    if (!supabase) return

    setIsWorking(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(),
      },
    })

    if (error) {
      setIsWorking(false)
      setMessage(error.message)
    }
  }

  async function signOut() {
    if (!supabase) return

    setIsWorking(true)
    await supabase.auth.signOut()
    setIsWorking(false)
  }

  if (user) {
    return (
      <div className="auth-inline">
        <span className="account-pill" title={user.email || userLabel}>
          <UserRound size={15} aria-hidden="true" />
          {userLabel}
        </span>
        <button type="button" className="secondary-button compact-button" onClick={signOut} disabled={isWorking}>
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-inline">
      <button
        type="button"
        className="secondary-button compact-button"
        onClick={() => {
          setIsOpen(true)
          setMessage(isSupabaseConfigured ? '' : 'Add Supabase environment variables to enable login.')
        }}
      >
        <LogIn size={16} aria-hidden="true" />
        Log in
      </button>
      <button type="button" className="primary-button compact-button" onClick={() => setIsOpen(true)}>
        Sign up
      </button>

      {isOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Optional account</p>
                <h3 id="auth-title">Log in or sign up</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsOpen(false)} aria-label="Close login">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <form className="auth-form" onSubmit={sendMagicLink}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={!isSupabaseConfigured || isWorking}
                />
              </label>
              <button type="submit" className="primary-button" disabled={!isSupabaseConfigured || isWorking || !email.trim()}>
                <Mail size={17} aria-hidden="true" />
                Send magic link
              </button>
            </form>

            <div className="auth-divider">
              <span>Or continue with</span>
            </div>

            <div className="social-grid">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="secondary-button"
                  onClick={() => signInWithProvider(provider.id)}
                  disabled={!isSupabaseConfigured || isWorking}
                >
                  {provider.label}
                </button>
              ))}
            </div>

            <p className="helper-text auth-message">
              {message || 'All tools stay free and usable without an account.'}
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
