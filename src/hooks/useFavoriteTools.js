import { useMemo, useState } from 'react'

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

export function useFavoriteTools() {
  const [favorites, setFavorites] = useState(() => readLocalFavorites())
  const [favoritesMessage, setFavoritesMessage] = useState('')

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  function toggleFavorite(slug) {
    const isFavorite = favoriteSet.has(slug)
    const nextFavorites = isFavorite ? favorites.filter((item) => item !== slug) : [...favorites, slug]

    setFavorites(nextFavorites)
    writeLocalFavorites(nextFavorites)
    setFavoritesMessage('Favorites saved in this browser.')
  }

  return {
    favorites,
    favoriteSet,
    favoritesMessage,
    toggleFavorite,
  }
}
