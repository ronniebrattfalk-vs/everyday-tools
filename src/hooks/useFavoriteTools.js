import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const STORAGE_KEY = 'everyday-tools:favorites'

function readLocalFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocalFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

export function useFavoriteTools(user) {
  const [favorites, setFavorites] = useState(() => readLocalFavorites())
  const [favoritesMessage, setFavoritesMessage] = useState('')

  useEffect(() => {
    if (!user || !supabase) {
      return
    }

    let isMounted = true

    async function loadFavorites() {
      const { data, error } = await supabase
        .from('tool_favorites')
        .select('tool_slug')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!isMounted) return

      if (error) {
        setFavorites(readLocalFavorites())
        setFavoritesMessage('Favorites are saved locally until the Supabase table is created.')
        return
      }

      const syncedFavorites = data.map((item) => item.tool_slug)
      setFavorites(syncedFavorites)
      writeLocalFavorites(syncedFavorites)
      setFavoritesMessage('')
    }

    loadFavorites()

    return () => {
      isMounted = false
    }
  }, [user])

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  async function toggleFavorite(slug) {
    const isFavorite = favoriteSet.has(slug)
    const nextFavorites = isFavorite ? favorites.filter((item) => item !== slug) : [...favorites, slug]

    setFavorites(nextFavorites)
    writeLocalFavorites(nextFavorites)

    if (!user || !supabase) {
      setFavoritesMessage('Favorites saved in this browser.')
      return
    }

    const { error } = isFavorite
      ? await supabase.from('tool_favorites').delete().eq('user_id', user.id).eq('tool_slug', slug)
      : await supabase.from('tool_favorites').insert({ user_id: user.id, tool_slug: slug })

    if (error) {
      setFavoritesMessage('Favorites are saved locally until the Supabase table is created.')
      return
    }

    setFavoritesMessage('Favorites synced to your account.')
  }

  return {
    favorites,
    favoriteSet,
    favoritesMessage,
    toggleFavorite,
  }
}
