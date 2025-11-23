/**
 * Beam Calculation Utilities
 * Functions for determining and managing beam groups for musical notation
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  NoteDuration,
  MusicalEvent,
  TimeSignature,
  BeamGroup,
} from '../types/music'

/**
 * Determine if a duration should be beamed (eighth notes and shorter)
 */
export function shouldBeBeamed(duration: NoteDuration): boolean {
  return ['eighth', 'sixteenth', 'dotted-eighth'].includes(duration)
}

/**
 * Get number of beams needed for a duration
 * 1 for eighth, 2 for sixteenth, etc.
 */
export function getBeamCount(duration: NoteDuration): number {
  switch (duration) {
    case 'eighth':
    case 'dotted-eighth':
      return 1
    case 'sixteenth':
      return 2
    default:
      return 0
  }
}

/**
 * Check if two events can be beamed together
 * Requirements: same clef, consecutive, within same beat, appropriate duration
 */
export function canBeamTogether(
  event1: MusicalEvent,
  event2: MusicalEvent,
  _timeSignature: TimeSignature
): boolean {
  // Both must be note events (not rests)
  if (event1.type !== 'note' || event2.type !== 'note') {
    return false
  }

  // Both must have beamable durations
  if (!shouldBeBeamed(event1.duration) || !shouldBeBeamed(event2.duration)) {
    return false
  }

  // Must be in the same measure
  if (event1.position.measureIndex !== event2.position.measureIndex) {
    return false
  }

  // Must be in the same clef
  const clef1 = event1.notes?.[0]?.clef
  const clef2 = event2.notes?.[0]?.clef
  if (!clef1 || !clef2 || clef1 !== clef2) {
    return false
  }

  // Check if they're within the same beat subdivision
  // For simplicity, we'll beam notes within the same quarter note beat
  const beat1 = Math.floor(event1.position.beatPosition)
  const beat2 = Math.floor(event2.position.beatPosition)

  return beat1 === beat2
}

/**
 * Automatically calculate beam groups for a measure based on time signature
 * Groups notes that fall within the same beat
 */
export function calculateBeamGroups(
  events: MusicalEvent[],
  timeSignature: TimeSignature
): BeamGroup[] {
  const beamGroups: BeamGroup[] = []

  // Sort events by position
  const sortedEvents = [...events].sort((a, b) =>
    a.position.beatPosition - b.position.beatPosition
  )

  let currentGroup: MusicalEvent[] = []

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i]

    // Skip if not beamable
    if (!shouldBeBeamed(event.duration) || event.type !== 'note') {
      // Save current group if it has at least 2 notes
      if (currentGroup.length >= 2) {
        beamGroups.push(createBeamGroup(currentGroup.map(e => e.id)))
      }
      currentGroup = []
      continue
    }

    // Check if this event can be added to current group
    if (currentGroup.length === 0) {
      currentGroup = [event]
    } else {
      const lastEvent = currentGroup[currentGroup.length - 1]

      if (canBeamTogether(lastEvent, event, timeSignature)) {
        currentGroup.push(event)
      } else {
        // Save current group if it has at least 2 notes
        if (currentGroup.length >= 2) {
          beamGroups.push(createBeamGroup(currentGroup.map(e => e.id)))
        }
        currentGroup = [event]
      }
    }
  }

  // Don't forget the last group
  if (currentGroup.length >= 2) {
    beamGroups.push(createBeamGroup(currentGroup.map(e => e.id)))
  }

  return beamGroups
}

/**
 * Create a new beam group
 */
export function createBeamGroup(eventIds: string[]): BeamGroup {
  return {
    id: uuidv4(),
    eventIds,
    type: 'beam',
  }
}

/**
 * Add event to existing beam group
 */
export function addToBeamGroup(
  beamGroup: BeamGroup,
  eventId: string
): BeamGroup {
  return {
    ...beamGroup,
    eventIds: [...beamGroup.eventIds, eventId],
  }
}

/**
 * Remove event from beam group
 */
export function removeFromBeamGroup(
  beamGroup: BeamGroup,
  eventId: string
): BeamGroup {
  return {
    ...beamGroup,
    eventIds: beamGroup.eventIds.filter(id => id !== eventId),
  }
}

/**
 * Calculate beam groups for an entire score
 * Returns updated score with beam groups assigned
 */
export function calculateScoreBeamGroups(
  events: MusicalEvent[],
  timeSignature: TimeSignature
): { beamGroups: BeamGroup[]; updatedEvents: MusicalEvent[] } {
  // Group events by measure
  const eventsByMeasure = new Map<number, MusicalEvent[]>()

  for (const event of events) {
    const measureIndex = event.position.measureIndex
    if (!eventsByMeasure.has(measureIndex)) {
      eventsByMeasure.set(measureIndex, [])
    }
    eventsByMeasure.get(measureIndex)!.push(event)
  }

  // Calculate beam groups for each measure
  const allBeamGroups: BeamGroup[] = []
  const updatedEvents: MusicalEvent[] = []

  for (const [, measureEvents] of eventsByMeasure) {
    const measureBeamGroups = calculateBeamGroups(measureEvents, timeSignature)
    allBeamGroups.push(...measureBeamGroups)

    // Update events with beam group IDs
    for (const event of measureEvents) {
      const beamGroup = measureBeamGroups.find(bg => bg.eventIds.includes(event.id))
      updatedEvents.push({
        ...event,
        beamGroupId: beamGroup?.id,
      })
    }
  }

  return {
    beamGroups: allBeamGroups,
    updatedEvents,
  }
}
