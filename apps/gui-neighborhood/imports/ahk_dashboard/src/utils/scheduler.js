import { preparePrompt } from '../ai/autoAgent'

/**
 * Auto-sync AI insights on a 24-hour interval
 * Generates daily AI analysis reports automatically
 */
export function autoSyncInsights() {
  const hours24 = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  
  // Check if auto-sync is enabled (stored in localStorage)
  const isAutoSyncEnabled = () => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('ahk-auto-sync') === 'enabled'
  }

  // Initial report generation
  if (isAutoSyncEnabled()) {
    console.log(`[AutoSync] Generating initial AI report at ${new Date().toISOString()}`)
    try {
      preparePrompt()
      console.log(`[AutoSync] ✅ AI report generated successfully`)
    } catch (error) {
      console.error(`[AutoSync] ❌ Error generating report:`, error)
    }

    // Set up recurring generation
    const intervalId = setInterval(() => {
      console.log(`[AutoSync] Regenerating AI report at ${new Date().toISOString()}`)
      try {
        preparePrompt()
        console.log(`[AutoSync] ✅ AI report regenerated successfully`)
      } catch (error) {
        console.error(`[AutoSync] ❌ Error regenerating report:`, error)
      }
    }, hours24)

    // Return cleanup function
    return () => {
      clearInterval(intervalId)
      console.log('[AutoSync] Auto-sync stopped')
    }
  } else {
    console.log('[AutoSync] Auto-sync is disabled. Enable it in settings.')
    return () => {}
  }
}

/**
 * Enable auto-sync in localStorage
 */
export function enableAutoSync() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ahk-auto-sync', 'enabled')
    console.log('[AutoSync] Auto-sync enabled')
    return true
  }
  return false
}

/**
 * Disable auto-sync in localStorage
 */
export function disableAutoSync() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ahk-auto-sync', 'disabled')
    console.log('[AutoSync] Auto-sync disabled')
    return true
  }
  return false
}

/**
 * Check if auto-sync is currently enabled
 */
export function isAutoSyncEnabled() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ahk-auto-sync') === 'enabled'
  }
  return false
}

export default {
  autoSyncInsights,
  enableAutoSync,
  disableAutoSync,
  isAutoSyncEnabled
}
