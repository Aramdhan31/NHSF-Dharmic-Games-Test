"use client"

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue] as const
}

// Hook for managing favorite universities
export function useFavoriteUniversities() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorite-universities', [])
  
  const addFavorite = (universityId: string) => {
    if (!favorites.includes(universityId)) {
      setFavorites([...favorites, universityId])
    }
  }
  
  const removeFavorite = (universityId: string) => {
    setFavorites(favorites.filter(id => id !== universityId))
  }
  
  const toggleFavorite = (universityId: string) => {
    if (favorites.includes(universityId)) {
      removeFavorite(universityId)
    } else {
      addFavorite(universityId)
    }
  }
  
  const isFavorite = (universityId: string) => favorites.includes(universityId)
  
  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  }
}

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useLocalStorage('notification-preferences', {
    enabled: true,
    favoriteTeams: true,
    liveMatches: true,
    scoreUpdates: true,
    tournamentUpdates: true,
    browserNotifications: false, // Requires permission
    sound: false
  })
  
  const updatePreferences = (newPreferences: Partial<typeof preferences>) => {
    setPreferences({ ...preferences, ...newPreferences })
  }
  
  return {
    preferences,
    updatePreferences
  }
}

// Hook for managing user's followed tournaments
export function useFollowedTournaments() {
  const [followed, setFollowed] = useLocalStorage<string[]>('followed-tournaments', [])
  
  const addTournament = (tournament: string) => {
    if (!followed.includes(tournament)) {
      setFollowed([...followed, tournament])
    }
  }
  
  const removeTournament = (tournament: string) => {
    setFollowed(followed.filter(t => t !== tournament))
  }
  
  const toggleTournament = (tournament: string) => {
    if (followed.includes(tournament)) {
      removeTournament(tournament)
    } else {
      addTournament(tournament)
    }
  }
  
  const isFollowing = (tournament: string) => followed.includes(tournament)
  
  return {
    followed,
    addTournament,
    removeTournament,
    toggleTournament,
    isFollowing
  }
}
