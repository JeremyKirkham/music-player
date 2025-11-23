/**
 * Playback Utility Functions
 * Functions for playing back music scores with timing
 */

import type { MusicalEvent, NoteDuration, Note } from '../types/music'
import { formatNoteToString } from './musicUtilities'

// Map durations to seconds (assuming 120 BPM, quarter note = 0.5 seconds)
const DEFAULT_BPM = 120
const BEAT_DURATION = 60 / DEFAULT_BPM // seconds per beat

export const getDurationInSeconds = (duration: NoteDuration): number => {
  const durationMap: Record<NoteDuration, number> = {
    'whole': 4,
    'half': 2,
    'quarter': 1,
    'eighth': 0.5,
    'sixteenth': 0.25,
    'dotted-half': 3,
    'dotted-quarter': 1.5,
    'dotted-eighth': 0.75,
  }

  return durationMap[duration] * BEAT_DURATION
}

export const getDurationInBeats = (duration: NoteDuration): number => {
  const durationMap: Record<NoteDuration, number> = {
    'whole': 4,
    'half': 2,
    'quarter': 1,
    'eighth': 0.5,
    'sixteenth': 0.25,
    'dotted-half': 3,
    'dotted-quarter': 1.5,
    'dotted-eighth': 0.75,
  }

  return durationMap[duration]
}

// Get note frequency from note data
export const getNoteFrequency = (note: Note): number => {
  const noteFrequencies: { [key: string]: number } = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
    'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
    'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51,
    'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00,
    'A#6': 1864.66, 'B6': 1975.53,
    'C7': 2093.00,
  }

  const noteString = formatNoteToString(note)
  return noteFrequencies[noteString] || 440
}

export interface ScheduledNote {
  event: MusicalEvent
  startTime: number // in seconds from start of playback
  duration: number // in seconds
}

/**
 * Calculate scheduled playback times for all events
 */
export const scheduleEvents = (events: MusicalEvent[], beatsPerMeasure: number = 4): ScheduledNote[] => {
  const scheduled: ScheduledNote[] = []

  // Sort events by position
  const sortedEvents = [...events].sort((a, b) => {
    if (a.position.measureIndex !== b.position.measureIndex) {
      return a.position.measureIndex - b.position.measureIndex
    }
    return a.position.beatPosition - b.position.beatPosition
  })

  for (const event of sortedEvents) {
    // Calculate absolute time based on measure and beat position
    const absoluteBeatPosition =
      event.position.measureIndex * beatsPerMeasure + event.position.beatPosition
    const startTime = absoluteBeatPosition * BEAT_DURATION
    const duration = getDurationInSeconds(event.duration)

    scheduled.push({
      event,
      startTime,
      duration,
    })
  }

  return scheduled
}

/**
 * Play a note using Web Audio API
 */
export const playNoteSound = (
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  startTime: number = 0
): void => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = frequency
  oscillator.type = 'sine'

  const now = audioContext.currentTime
  const actualStartTime = startTime > 0 ? now + startTime : now

  gainNode.gain.setValueAtTime(0.3, actualStartTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, actualStartTime + Math.min(duration, 0.5))

  oscillator.start(actualStartTime)
  oscillator.stop(actualStartTime + Math.min(duration, 0.5))
}
