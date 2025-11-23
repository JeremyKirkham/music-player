/**
 * Music Utility Functions
 * Core functions for managing music scores and events
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  Note,
  NoteDuration,
  MusicalEvent,
  TimeSignature,
  MusicScore,
  Measure,
} from '../types/music'

/**
 * Parse note string "C#4" into structured format
 */
export function parseNoteString(noteString: string): Omit<Note, 'clef'> {
  const match = noteString.match(/^([A-G])(#|b)?(\d+)$/)

  if (!match) {
    throw new Error(`Invalid note string: ${noteString}`)
  }

  const [, pitch, accidental, octaveStr] = match

  return {
    pitch,
    octave: parseInt(octaveStr, 10),
    accidental: accidental === '#' ? 'sharp' : accidental === 'b' ? 'flat' : undefined,
  }
}

/**
 * Create note string from structured format
 */
export function formatNoteToString(note: Note): string {
  const accidentalStr = note.accidental === 'sharp' ? '#' : note.accidental === 'flat' ? 'b' : ''
  return `${note.pitch}${accidentalStr}${note.octave}`
}

/**
 * Initialize empty score
 */
export function createEmptyScore(timeSignature: TimeSignature): MusicScore {
  const now = new Date().toISOString()

  return {
    metadata: {
      createdAt: now,
      modifiedAt: now,
      version: '1.0.0',
    },
    timeSignature,
    measures: [],
    events: [],
    beamGroups: [],
  }
}

/**
 * Add event to score
 */
export function addEventToScore(score: MusicScore, event: MusicalEvent): MusicScore {
  const newScore = { ...score }

  // Add event to events array
  newScore.events = [...score.events, event]

  // Update or create measure
  const measureIndex = event.position.measureIndex
  const existingMeasure = newScore.measures.find(m => m.index === measureIndex)

  if (existingMeasure) {
    // Add event ID to existing measure
    const updatedMeasure = {
      ...existingMeasure,
      events: [...existingMeasure.events, event.id],
    }
    newScore.measures = newScore.measures.map(m =>
      m.index === measureIndex ? updatedMeasure : m
    )
  } else {
    // Create new measure
    const newMeasure: Measure = {
      index: measureIndex,
      events: [event.id],
      beamGroups: [],
      timeSignature: score.timeSignature,
    }
    newScore.measures = [...newScore.measures, newMeasure].sort((a, b) => a.index - b.index)
  }

  // Update modified timestamp
  newScore.metadata = {
    ...newScore.metadata,
    modifiedAt: new Date().toISOString(),
  }

  return newScore
}

/**
 * Remove event from score
 */
export function removeEventFromScore(score: MusicScore, eventId: string): MusicScore {
  const newScore = { ...score }

  // Remove event from events array
  newScore.events = score.events.filter(e => e.id !== eventId)

  // Remove event from measures
  newScore.measures = score.measures.map(measure => ({
    ...measure,
    events: measure.events.filter(id => id !== eventId),
  })).filter(measure => measure.events.length > 0) // Remove empty measures

  // Remove from beam groups
  newScore.beamGroups = score.beamGroups
    .map(bg => ({
      ...bg,
      eventIds: bg.eventIds.filter(id => id !== eventId),
    }))
    .filter(bg => bg.eventIds.length > 1) // Remove beam groups with less than 2 notes

  // Update measure beam groups
  newScore.measures = newScore.measures.map(measure => ({
    ...measure,
    beamGroups: measure.beamGroups.filter(bgId =>
      newScore.beamGroups.some(bg => bg.id === bgId)
    ),
  }))

  // Update modified timestamp
  newScore.metadata = {
    ...newScore.metadata,
    modifiedAt: new Date().toISOString(),
  }

  return newScore
}

/**
 * Update event in score
 */
export function updateEventInScore(
  score: MusicScore,
  eventId: string,
  updates: Partial<MusicalEvent>
): MusicScore {
  const newScore = { ...score }

  newScore.events = score.events.map(event =>
    event.id === eventId ? { ...event, ...updates } : event
  )

  // Update modified timestamp
  newScore.metadata = {
    ...newScore.metadata,
    modifiedAt: new Date().toISOString(),
  }

  return newScore
}

/**
 * Validate score structure
 */
export function validateScore(score: MusicScore): boolean {
  try {
    // Check all events have valid IDs
    if (!score.events.every(e => e.id && typeof e.id === 'string')) {
      return false
    }

    // Check all event IDs in measures exist
    const eventIds = new Set(score.events.map(e => e.id))
    for (const measure of score.measures) {
      if (!measure.events.every(id => eventIds.has(id))) {
        return false
      }
    }

    // Check beam groups reference valid events
    for (const beamGroup of score.beamGroups) {
      if (!beamGroup.eventIds.every(id => eventIds.has(id))) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Get events in a specific measure
 */
export function getEventsInMeasure(score: MusicScore, measureIndex: number): MusicalEvent[] {
  const measure = score.measures.find(m => m.index === measureIndex)
  if (!measure) return []

  return measure.events
    .map(eventId => score.events.find(e => e.id === eventId))
    .filter((e): e is MusicalEvent => e !== undefined)
}

/**
 * Calculate total duration of events in beats
 */
export function calculateTotalDuration(events: MusicalEvent[]): number {
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

  return events.reduce((total, event) => total + durationMap[event.duration], 0)
}

/**
 * Generate a unique ID for a musical element
 */
export function generateId(): string {
  return uuidv4()
}

/**
 * Get current measure and beat position based on existing events
 */
export function getCurrentPosition(
  score: MusicScore,
  timeSignature: TimeSignature
): { measureIndex: number; beatPosition: number } {
  if (score.events.length === 0) {
    return { measureIndex: 0, beatPosition: 0 }
  }

  // Get the last event
  const lastEvent = score.events[score.events.length - 1]
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

  const eventDuration = durationMap[lastEvent.duration]
  let nextBeatPosition = lastEvent.position.beatPosition + eventDuration
  let measureIndex = lastEvent.position.measureIndex

  // Check if we need to move to the next measure
  if (nextBeatPosition >= timeSignature.numerator) {
    measureIndex++
    nextBeatPosition = 0
  }

  return { measureIndex, beatPosition: nextBeatPosition }
}
