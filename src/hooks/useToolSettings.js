import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

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

export function useToolSettings(user) {
  const [settings, setSettings] = useState(() => readLocalSettings())
  const [settingsMessage, setSettingsMessage] = useState('')

  useEffect(() => {
    if (!user || !supabase) return

    let isMounted = true

    async function loadSettings() {
      const { data, error } = await supabase
        .from('user_tool_settings')
        .select('default_tool_slug')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        setSettings(readLocalSettings())
        setSettingsMessage('Default tool is saved locally until the Supabase settings table is created.')
        return
      }

      const nextSettings = {
        ...readLocalSettings(),
        defaultToolSlug: data?.default_tool_slug || readLocalSettings().defaultToolSlug || null,
      }
      setSettings(nextSettings)
      writeLocalSettings(nextSettings)
      setSettingsMessage('')
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [user])

  async function setDefaultTool(slug) {
    const nextSettings = {
      ...settings,
      defaultToolSlug: slug,
    }

    setSettings(nextSettings)
    writeLocalSettings(nextSettings)

    if (!user || !supabase) {
      setSettingsMessage('Default tool saved in this browser.')
      return
    }

    const { error } = await supabase.from('user_tool_settings').upsert({
      user_id: user.id,
      default_tool_slug: slug,
      updated_at: new Date().toISOString(),
    })

    setSettingsMessage(
      error
        ? 'Default tool is saved locally until the Supabase settings table is created.'
        : 'Default tool synced to your account.',
    )
  }

  return {
    defaultToolSlug: settings.defaultToolSlug || null,
    settingsMessage,
    setDefaultTool,
  }
}
