import { describe, it, expect } from 'vitest'
import {
  shouldBeBeamed,
  getBeamCount,
  canBeamTogether,
  calculateBeamGroups,
  createBeamGroup,
  addToBeamGroup,
  removeFromBeamGroup,
  calculateScoreBeamGroups,
} from './beamCalculation'
import type { MusicalEvent, TimeSignature } from '../types/music'

describe('beamCalculation', () => {
  const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }

  describe('shouldBeBeamed', () => {
    it('should return true for eighth notes', () => {
      expect(shouldBeBeamed('eighth')).toBe(true)
    })

    it('should return true for sixteenth notes', () => {
      expect(shouldBeBeamed('sixteenth')).toBe(true)
    })

    it('should return true for dotted eighth notes', () => {
      expect(shouldBeBeamed('dotted-eighth')).toBe(true)
    })

    it('should return false for quarter notes', () => {
      expect(shouldBeBeamed('quarter')).toBe(false)
    })

    it('should return false for half notes', () => {
      expect(shouldBeBeamed('half')).toBe(false)
    })

    it('should return false for whole notes', () => {
      expect(shouldBeBeamed('whole')).toBe(false)
    })

    it('should return false for dotted quarter notes', () => {
      expect(shouldBeBeamed('dotted-quarter')).toBe(false)
    })
  })

  describe('getBeamCount', () => {
    it('should return 1 for eighth notes', () => {
      expect(getBeamCount('eighth')).toBe(1)
    })

    it('should return 1 for dotted eighth notes', () => {
      expect(getBeamCount('dotted-eighth')).toBe(1)
    })

    it('should return 2 for sixteenth notes', () => {
      expect(getBeamCount('sixteenth')).toBe(2)
    })

    it('should return 0 for quarter notes', () => {
      expect(getBeamCount('quarter')).toBe(0)
    })

    it('should return 0 for half notes', () => {
      expect(getBeamCount('half')).toBe(0)
    })

    it('should return 0 for whole notes', () => {
      expect(getBeamCount('whole')).toBe(0)
    })
  })

  describe('canBeamTogether', () => {
    const createEvent = (
      duration: string,
      measureIndex: number,
      beatPosition: number,
      clef: 'treble' | 'bass' = 'treble',
      type: 'note' | 'rest' = 'note'
    ): MusicalEvent => ({
      id: `event-${Math.random()}`,
      type,
      duration: duration as MusicalEvent['duration'],
      notes: type === 'note' ? [{ pitch: 'C', octave: 4, clef }] : undefined,
      position: { measureIndex, beatPosition },
    })

    it('should return true for two eighth notes in same beat and clef', () => {
      const event1 = createEvent('eighth', 0, 0.0, 'treble')
      const event2 = createEvent('eighth', 0, 0.5, 'treble')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(true)
    })

    it('should return false if first event is a rest', () => {
      const event1 = createEvent('eighth', 0, 0.0, 'treble', 'rest')
      const event2 = createEvent('eighth', 0, 0.5, 'treble')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(false)
    })

    it('should return false if second event is a rest', () => {
      const event1 = createEvent('eighth', 0, 0.0, 'treble')
      const event2 = createEvent('eighth', 0, 0.5, 'treble', 'rest')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(false)
    })

    it('should return false if durations are not beamable', () => {
      const event1 = createEvent('quarter', 0, 0.0, 'treble')
      const event2 = createEvent('quarter', 0, 0.5, 'treble')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(false)
    })

    it('should return false if events are in different measures', () => {
      const event1 = createEvent('eighth', 0, 0.0, 'treble')
      const event2 = createEvent('eighth', 1, 0.0, 'treble')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(false)
    })

    it('should return false if events are in different clefs', () => {
      const event1 = createEvent('eighth', 0, 0.0, 'treble')
      const event2 = createEvent('eighth', 0, 0.5, 'bass')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(false)
    })

    it('should return false if events are in different beats', () => {
      const event1 = createEvent('eighth', 0, 0.0, 'treble')
      const event2 = createEvent('eighth', 0, 1.0, 'treble')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(false)
    })

    it('should return true for sixteenth notes in same beat', () => {
      const event1 = createEvent('sixteenth', 0, 0.0, 'treble')
      const event2 = createEvent('sixteenth', 0, 0.25, 'treble')
      expect(canBeamTogether(event1, event2, timeSignature)).toBe(true)
    })
  })

  describe('createBeamGroup', () => {
    it('should create a beam group with given event IDs', () => {
      const eventIds = ['event1', 'event2', 'event3']
      const beamGroup = createBeamGroup(eventIds)

      expect(beamGroup.id).toBeDefined()
      expect(beamGroup.eventIds).toEqual(eventIds)
      expect(beamGroup.type).toBe('beam')
    })

    it('should generate unique IDs for different beam groups', () => {
      const beamGroup1 = createBeamGroup(['event1'])
      const beamGroup2 = createBeamGroup(['event2'])

      expect(beamGroup1.id).not.toBe(beamGroup2.id)
    })
  })

  describe('addToBeamGroup', () => {
    it('should add event ID to beam group', () => {
      const beamGroup = createBeamGroup(['event1', 'event2'])
      const updatedGroup = addToBeamGroup(beamGroup, 'event3')

      expect(updatedGroup.eventIds).toEqual(['event1', 'event2', 'event3'])
      expect(updatedGroup.id).toBe(beamGroup.id)
    })

    it('should not mutate original beam group', () => {
      const beamGroup = createBeamGroup(['event1', 'event2'])
      const originalIds = [...beamGroup.eventIds]
      addToBeamGroup(beamGroup, 'event3')

      expect(beamGroup.eventIds).toEqual(originalIds)
    })
  })

  describe('removeFromBeamGroup', () => {
    it('should remove event ID from beam group', () => {
      const beamGroup = createBeamGroup(['event1', 'event2', 'event3'])
      const updatedGroup = removeFromBeamGroup(beamGroup, 'event2')

      expect(updatedGroup.eventIds).toEqual(['event1', 'event3'])
      expect(updatedGroup.id).toBe(beamGroup.id)
    })

    it('should not mutate original beam group', () => {
      const beamGroup = createBeamGroup(['event1', 'event2', 'event3'])
      const originalIds = [...beamGroup.eventIds]
      removeFromBeamGroup(beamGroup, 'event2')

      expect(beamGroup.eventIds).toEqual(originalIds)
    })

    it('should handle removing non-existent event ID', () => {
      const beamGroup = createBeamGroup(['event1', 'event2'])
      const updatedGroup = removeFromBeamGroup(beamGroup, 'event3')

      expect(updatedGroup.eventIds).toEqual(['event1', 'event2'])
    })
  })

  describe('calculateBeamGroups', () => {
    const createEvent = (
      id: string,
      duration: string,
      beatPosition: number,
      measureIndex: number = 0,
      clef: 'treble' | 'bass' = 'treble',
      type: 'note' | 'rest' = 'note'
    ): MusicalEvent => ({
      id,
      type,
      duration: duration as MusicalEvent['duration'],
      notes: type === 'note' ? [{ pitch: 'C', octave: 4, clef }] : undefined,
      position: { measureIndex, beatPosition },
    })

    it('should create beam group for two consecutive eighth notes', () => {
      const events = [
        createEvent('e1', 'eighth', 0.0),
        createEvent('e2', 'eighth', 0.5),
      ]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(1)
      expect(beamGroups[0].eventIds).toEqual(['e1', 'e2'])
    })

    it('should not create beam group for single eighth note', () => {
      const events = [createEvent('e1', 'eighth', 0.0)]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(0)
    })

    it('should create separate beam groups for notes in different beats', () => {
      const events = [
        createEvent('e1', 'eighth', 0.0),
        createEvent('e2', 'eighth', 0.5),
        createEvent('e3', 'eighth', 1.0),
        createEvent('e4', 'eighth', 1.5),
      ]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(2)
      expect(beamGroups[0].eventIds).toEqual(['e1', 'e2'])
      expect(beamGroups[1].eventIds).toEqual(['e3', 'e4'])
    })

    it('should not beam quarter notes', () => {
      const events = [
        createEvent('e1', 'quarter', 0.0),
        createEvent('e2', 'quarter', 1.0),
      ]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(0)
    })

    it('should not beam rests', () => {
      const events = [
        createEvent('e1', 'eighth', 0.0, 0, 'treble', 'rest'),
        createEvent('e2', 'eighth', 0.5, 0, 'treble', 'rest'),
      ]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(0)
    })

    it('should handle mixed durations correctly', () => {
      const events = [
        createEvent('e1', 'eighth', 0.0),
        createEvent('e2', 'eighth', 0.5),
        createEvent('e3', 'quarter', 1.0),
        createEvent('e4', 'eighth', 2.0),
        createEvent('e5', 'eighth', 2.5),
      ]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(2)
      expect(beamGroups[0].eventIds).toEqual(['e1', 'e2'])
      expect(beamGroups[1].eventIds).toEqual(['e4', 'e5'])
    })

    it('should handle four eighth notes in same beat', () => {
      const events = [
        createEvent('e1', 'eighth', 0.0),
        createEvent('e2', 'eighth', 0.25),
        createEvent('e3', 'eighth', 0.5),
        createEvent('e4', 'eighth', 0.75),
      ]

      const beamGroups = calculateBeamGroups(events, timeSignature)

      expect(beamGroups).toHaveLength(1)
      expect(beamGroups[0].eventIds).toEqual(['e1', 'e2', 'e3', 'e4'])
    })
  })

  describe('calculateScoreBeamGroups', () => {
    const createEvent = (
      id: string,
      duration: string,
      measureIndex: number,
      beatPosition: number,
      clef: 'treble' | 'bass' = 'treble'
    ): MusicalEvent => ({
      id,
      type: 'note',
      duration: duration as MusicalEvent['duration'],
      notes: [{ pitch: 'C', octave: 4, clef }],
      position: { measureIndex, beatPosition },
    })

    it('should calculate beam groups across multiple measures', () => {
      const events = [
        createEvent('e1', 'eighth', 0, 0.0),
        createEvent('e2', 'eighth', 0, 0.5),
        createEvent('e3', 'eighth', 1, 0.0),
        createEvent('e4', 'eighth', 1, 0.5),
      ]

      const result = calculateScoreBeamGroups(events, timeSignature)

      expect(result.beamGroups).toHaveLength(2)
      expect(result.updatedEvents).toHaveLength(4)
    })

    it('should assign beam group IDs to events', () => {
      const events = [
        createEvent('e1', 'eighth', 0, 0.0),
        createEvent('e2', 'eighth', 0, 0.5),
      ]

      const result = calculateScoreBeamGroups(events, timeSignature)

      expect(result.updatedEvents[0].beamGroupId).toBeDefined()
      expect(result.updatedEvents[1].beamGroupId).toBeDefined()
      expect(result.updatedEvents[0].beamGroupId).toBe(
        result.updatedEvents[1].beamGroupId
      )
    })

    it('should not assign beam group ID to single notes', () => {
      const events = [
        createEvent('e1', 'eighth', 0, 0.0),
        createEvent('e2', 'quarter', 0, 1.0),
      ]

      const result = calculateScoreBeamGroups(events, timeSignature)

      expect(result.updatedEvents[0].beamGroupId).toBeUndefined()
      expect(result.updatedEvents[1].beamGroupId).toBeUndefined()
    })

    it('should handle events across different measures correctly', () => {
      const events = [
        createEvent('e1', 'eighth', 0, 0.0),
        createEvent('e2', 'eighth', 0, 0.5),
        createEvent('e3', 'eighth', 1, 0.0),
        createEvent('e4', 'eighth', 1, 0.5),
        createEvent('e5', 'eighth', 2, 0.0),
      ]

      const result = calculateScoreBeamGroups(events, timeSignature)

      expect(result.beamGroups).toHaveLength(2)
      const measure0BeamGroupId = result.updatedEvents[0].beamGroupId
      const measure1BeamGroupId = result.updatedEvents[2].beamGroupId

      expect(measure0BeamGroupId).toBeDefined()
      expect(measure1BeamGroupId).toBeDefined()
      expect(measure0BeamGroupId).not.toBe(measure1BeamGroupId)
      expect(result.updatedEvents[4].beamGroupId).toBeUndefined()
    })

    it('should handle empty events array', () => {
      const result = calculateScoreBeamGroups([], timeSignature)

      expect(result.beamGroups).toHaveLength(0)
      expect(result.updatedEvents).toHaveLength(0)
    })
  })
})
