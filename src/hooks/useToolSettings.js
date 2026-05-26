import { useState } from 'react'

const STORAGE_KEY = 'everyday-tools:settings'

function readLocalSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeLocalSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function readLocalDefaultTool() {
  return readLocalSettings().defaultToolSlug || null
}

export function useToolSettings() {
  const [settings, setSettings] = useState(() => readLocalSettings())
  const [settingsMessage, setSettingsMessage] = useState('')

  function setDefaultTool(slug) {
    const nextSettings = {
      ...settings,
      defaultToolSlug: slug,
    }

    setSettings(nextSettings)
    writeLocalSettings(nextSettings)
    setSettingsMessage('Default tool saved in this browser.')
  }

  return {
    defaultToolSlug: settings.defaultToolSlug || null,
    settingsMessage,
    setDefaultTool,
  }
}
