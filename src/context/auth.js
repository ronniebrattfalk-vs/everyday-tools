import { createContext, useContext } from 'react'

export const AuthContext = createContext({
  session: null,
  user: null,
  isAuthReady: false,
})

export function useAuth() {
  return useContext(AuthContext)
}
