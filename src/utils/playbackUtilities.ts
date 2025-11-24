/**
 * Playback Utility Functions
 * Functions for playing back music scores with timing
 */

import type { MusicalEvent, NoteDuration, Note } from '../types/music'
import { formatNoteToString } from './musicUtilities'

// Map durations to seconds (tempo-dependent)
const DEFAULT_BPM = 120

export const getDurationInSeconds = (duration: NoteDuration, bpm: number = DEFAULT_BPM): number => {
  const beatDuration = 60 / bpm // seconds per beat
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

  return durationMap[duration] * beatDuration
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
    // Octave 4 - Natural notes
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    // Octave 4 - Sharp notes
    'C#4': 277.18, 'D#4': 311.13, 'F#4': 369.99, 'G#4': 415.30, 'A#4': 466.16,
    // Octave 4 - Flat notes (enharmonic equivalents)
    'Db4': 277.18, 'Eb4': 311.13, 'Gb4': 369.99, 'Ab4': 415.30, 'Bb4': 466.16,
    
    // Octave 5 - Natural notes
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    // Octave 5 - Sharp notes
    'C#5': 554.37, 'D#5': 622.25, 'F#5': 739.99, 'G#5': 830.61, 'A#5': 932.33,
    // Octave 5 - Flat notes (enharmonic equivalents)
    'Db5': 554.37, 'Eb5': 622.25, 'Gb5': 739.99, 'Ab5': 830.61, 'Bb5': 932.33,
    
    // Octave 6 - Natural notes
    'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53,
    // Octave 6 - Sharp notes
    'C#6': 1108.73, 'D#6': 1244.51, 'F#6': 1479.98, 'G#6': 1661.22, 'A#6': 1864.66,
    // Octave 6 - Flat notes (enharmonic equivalents)
    'Db6': 1108.73, 'Eb6': 1244.51, 'Gb6': 1479.98, 'Ab6': 1661.22, 'Bb6': 1864.66,
    
    // Octave 7
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
export const scheduleEvents = (events: MusicalEvent[], beatsPerMeasure: number = 4, bpm: number = DEFAULT_BPM): ScheduledNote[] => {
  const scheduled: ScheduledNote[] = []
  const beatDuration = 60 / bpm // seconds per beat

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
    const startTime = absoluteBeatPosition * beatDuration
    const duration = getDurationInSeconds(event.duration, bpm)

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
