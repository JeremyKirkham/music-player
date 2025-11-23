/**
 * Local Storage Utilities
 * Functions for persisting music scores to localStorage
 */

import type { MusicScore } from '../types/music'

const STORAGE_KEY_PREFIX = 'music-player-score-'
const SCORES_LIST_KEY = 'music-player-scores-list'

/**
 * Save score to localStorage
 */
export function saveToLocalStorage(score: MusicScore, id?: string): string {
  const scoreId = id || `score-${Date.now()}`
  const storageKey = `${STORAGE_KEY_PREFIX}${scoreId}`

  try {
    // Save the score
    localStorage.setItem(storageKey, JSON.stringify(score))

    // Update the scores list
    const scoresList = listLocalScores()
    const existingIndex = scoresList.findIndex(s => s.id === scoreId)

    const scoreInfo = {
      id: scoreId,
      title: score.metadata.title || 'Untitled Score',
      modifiedAt: score.metadata.modifiedAt,
    }

    if (existingIndex >= 0) {
      scoresList[existingIndex] = scoreInfo
    } else {
      scoresList.push(scoreInfo)
    }

    localStorage.setItem(SCORES_LIST_KEY, JSON.stringify(scoresList))

    return scoreId
  } catch (error) {
    console.error('Failed to save score to localStorage:', error)
    throw new Error('Failed to save score')
  }
}

/**
 * Load score from localStorage
 */
export function loadFromLocalStorage(id: string): MusicScore | null {
  const storageKey = `${STORAGE_KEY_PREFIX}${id}`

  try {
    const scoreData = localStorage.getItem(storageKey)
    if (!scoreData) {
      return null
    }

    return JSON.parse(scoreData) as MusicScore
  } catch (error) {
    console.error('Failed to load score from localStorage:', error)
    return null
  }
}

/**
 * List all local scores
 */
export function listLocalScores(): Array<{
  id: string
  title: string
  modifiedAt: string
}> {
  try {
    const scoresListData = localStorage.getItem(SCORES_LIST_KEY)
    if (!scoresListData) {
      return []
    }

    return JSON.parse(scoresListData)
  } catch (error) {
    console.error('Failed to list scores from localStorage:', error)
    return []
  }
}

/**
 * Delete score from localStorage
 */
export function deleteFromLocalStorage(id: string): boolean {
  const storageKey = `${STORAGE_KEY_PREFIX}${id}`

  try {
    // Remove the score
    localStorage.removeItem(storageKey)

    // Update the scores list
    const scoresList = listLocalScores()
    const updatedList = scoresList.filter(s => s.id !== id)
    localStorage.setItem(SCORES_LIST_KEY, JSON.stringify(updatedList))

    return true
  } catch (error) {
    console.error('Failed to delete score from localStorage:', error)
    return false
  }
}

/**
 * Clear all scores from localStorage
 */
export function clearAllLocalScores(): boolean {
  try {
    const scoresList = listLocalScores()

    // Remove all individual scores
    for (const score of scoresList) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${score.id}`)
    }

    // Clear the scores list
    localStorage.removeItem(SCORES_LIST_KEY)

    return true
  } catch (error) {
    console.error('Failed to clear all scores from localStorage:', error)
    return false
  }
}

/**
 * Export score as JSON file
 */
export function exportScoreAsJSON(score: MusicScore, filename?: string): void {
  const json = JSON.stringify(score, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${score.metadata.title || 'score'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import score from JSON file
 */
export function importScoreFromJSON(file: File): Promise<MusicScore> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const json = event.target?.result as string
        const score = JSON.parse(json) as MusicScore
        resolve(score)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}
