import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './auth.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return undefined

    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setIsAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthReady(true)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthReady,
    }),
    [isAuthReady, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
