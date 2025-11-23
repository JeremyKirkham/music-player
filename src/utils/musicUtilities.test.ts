import { describe, it, expect } from 'vitest'
import {
  recalculateScoreForTimeSignature,
  createEmptyScore,
  generateId,
} from './musicUtilities'
import type { MusicalEvent, TimeSignature } from '../types/music'

describe('recalculateScoreForTimeSignature', () => {
  describe('basic recalculation', () => {
    it('should recalculate positions for events in 4/4 time', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      // Add 4 quarter notes (fills one measure exactly)
      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'D', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 1 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'E', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 2 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'F', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 3 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      expect(result.events).toHaveLength(4)
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 1 })
      expect(result.events[2].position).toEqual({ measureIndex: 0, beatPosition: 2 })
      expect(result.events[3].position).toEqual({ measureIndex: 0, beatPosition: 3 })
      expect(result.measures).toHaveLength(1)
      expect(result.measures[0].index).toBe(0)
    })

    it('should handle notes overflowing into multiple measures', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      // Add 8 quarter notes (should fill 2 measures)
      const events: MusicalEvent[] = Array.from({ length: 8 }, () => ({
        id: generateId(),
        type: 'note' as const,
        duration: 'quarter' as const,
        notes: [{ pitch: 'C', octave: 4, clef: 'treble' as const }],
        position: { measureIndex: 0, beatPosition: 0 },
      }))

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      expect(result.events).toHaveLength(8)
      expect(result.measures).toHaveLength(2)

      // First measure: beats 0, 1, 2, 3
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 1 })
      expect(result.events[2].position).toEqual({ measureIndex: 0, beatPosition: 2 })
      expect(result.events[3].position).toEqual({ measureIndex: 0, beatPosition: 3 })

      // Second measure: beats 0, 1, 2, 3
      expect(result.events[4].position).toEqual({ measureIndex: 1, beatPosition: 0 })
      expect(result.events[5].position).toEqual({ measureIndex: 1, beatPosition: 1 })
      expect(result.events[6].position).toEqual({ measureIndex: 1, beatPosition: 2 })
      expect(result.events[7].position).toEqual({ measureIndex: 1, beatPosition: 3 })
    })
  })

  describe('different time signatures', () => {
    it('should recalculate for 3/4 time signature', () => {
      const timeSignature: TimeSignature = { numerator: 3, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      // Add 6 quarter notes (should fill 2 measures in 3/4 time)
      const events: MusicalEvent[] = Array.from({ length: 6 }, () => ({
        id: generateId(),
        type: 'note' as const,
        duration: 'quarter' as const,
        notes: [{ pitch: 'C', octave: 4, clef: 'treble' as const }],
        position: { measureIndex: 0, beatPosition: 0 },
      }))

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      expect(result.events).toHaveLength(6)
      expect(result.measures).toHaveLength(2)

      // First measure: 3 beats
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 1 })
      expect(result.events[2].position).toEqual({ measureIndex: 0, beatPosition: 2 })

      // Second measure: 3 beats
      expect(result.events[3].position).toEqual({ measureIndex: 1, beatPosition: 0 })
      expect(result.events[4].position).toEqual({ measureIndex: 1, beatPosition: 1 })
      expect(result.events[5].position).toEqual({ measureIndex: 1, beatPosition: 2 })
    })

    it('should recalculate when changing from 4/4 to 3/4', () => {
      const oldTimeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const newTimeSignature: TimeSignature = { numerator: 3, denominator: 4 }
      const score = createEmptyScore(oldTimeSignature)

      // Add 6 quarter notes positioned for 4/4 time
      const events: MusicalEvent[] = Array.from({ length: 6 }, (_, i) => ({
        id: generateId(),
        type: 'note' as const,
        duration: 'quarter' as const,
        notes: [{ pitch: 'C', octave: 4, clef: 'treble' as const }],
        position: { measureIndex: Math.floor(i / 4), beatPosition: i % 4 },
      }))

      score.events = events

      const result = recalculateScoreForTimeSignature(score, newTimeSignature)

      expect(result.timeSignature).toEqual(newTimeSignature)
      expect(result.measures).toHaveLength(2)

      // Should now be distributed as 3 notes per measure
      expect(result.events[0].position.measureIndex).toBe(0)
      expect(result.events[1].position.measureIndex).toBe(0)
      expect(result.events[2].position.measureIndex).toBe(0)
      expect(result.events[3].position.measureIndex).toBe(1)
      expect(result.events[4].position.measureIndex).toBe(1)
      expect(result.events[5].position.measureIndex).toBe(1)
    })
  })

  describe('different note durations', () => {
    it('should handle whole notes (4 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'whole',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'whole',
          notes: [{ pitch: 'D', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Each whole note takes a full 4/4 measure
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 1, beatPosition: 0 })
      expect(result.measures).toHaveLength(2)
    })

    it('should handle half notes (2 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'half',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'half',
          notes: [{ pitch: 'D', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Two half notes fit in one 4/4 measure
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 2 })
      expect(result.measures).toHaveLength(1)
    })

    it('should handle eighth notes (0.5 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = Array.from({ length: 8 }, () => ({
        id: generateId(),
        type: 'note' as const,
        duration: 'eighth' as const,
        notes: [{ pitch: 'C', octave: 4, clef: 'treble' as const }],
        position: { measureIndex: 0, beatPosition: 0 },
      }))

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // 8 eighth notes = 4 beats, fills one measure
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 0.5 })
      expect(result.events[2].position).toEqual({ measureIndex: 0, beatPosition: 1 })
      expect(result.events[3].position).toEqual({ measureIndex: 0, beatPosition: 1.5 })
      expect(result.events[4].position).toEqual({ measureIndex: 0, beatPosition: 2 })
      expect(result.events[5].position).toEqual({ measureIndex: 0, beatPosition: 2.5 })
      expect(result.events[6].position).toEqual({ measureIndex: 0, beatPosition: 3 })
      expect(result.events[7].position).toEqual({ measureIndex: 0, beatPosition: 3.5 })
      expect(result.measures).toHaveLength(1)
    })

    it('should handle sixteenth notes (0.25 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = Array.from({ length: 16 }, () => ({
        id: generateId(),
        type: 'note' as const,
        duration: 'sixteenth' as const,
        notes: [{ pitch: 'C', octave: 4, clef: 'treble' as const }],
        position: { measureIndex: 0, beatPosition: 0 },
      }))

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // 16 sixteenth notes = 4 beats, fills one measure
      expect(result.events[0].position.beatPosition).toBe(0)
      expect(result.events[1].position.beatPosition).toBe(0.25)
      expect(result.events[2].position.beatPosition).toBe(0.5)
      expect(result.events[3].position.beatPosition).toBe(0.75)
      expect(result.events[15].position.beatPosition).toBe(3.75)
      expect(result.measures).toHaveLength(1)
    })
  })

  describe('dotted notes', () => {
    it('should handle dotted half notes (3 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'dotted-half',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'D', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Dotted half (3 beats) + quarter (1 beat) = 4 beats = 1 measure
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 3 })
      expect(result.measures).toHaveLength(1)
    })

    it('should handle dotted quarter notes (1.5 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'dotted-quarter',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'eighth',
          notes: [{ pitch: 'D', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Dotted quarter (1.5 beats) + eighth (0.5 beats) = 2 beats
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 1.5 })
    })

    it('should handle dotted eighth notes (0.75 beats)', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'dotted-eighth',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
        {
          id: generateId(),
          type: 'note',
          duration: 'sixteenth',
          notes: [{ pitch: 'D', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Dotted eighth (0.75 beats) + sixteenth (0.25 beats) = 1 beat
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 0.75 })
    })
  })

  describe('mixed durations', () => {
    it('should handle a mix of different note durations', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        { id: generateId(), type: 'note', duration: 'half', notes: [{ pitch: 'C', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
        { id: generateId(), type: 'note', duration: 'quarter', notes: [{ pitch: 'D', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
        { id: generateId(), type: 'note', duration: 'eighth', notes: [{ pitch: 'E', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
        { id: generateId(), type: 'note', duration: 'eighth', notes: [{ pitch: 'F', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Half (2) + quarter (1) + eighth (0.5) + eighth (0.5) = 4 beats = 1 measure
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 0, beatPosition: 2 })
      expect(result.events[2].position).toEqual({ measureIndex: 0, beatPosition: 3 })
      expect(result.events[3].position).toEqual({ measureIndex: 0, beatPosition: 3.5 })
      expect(result.measures).toHaveLength(1)
    })

    it('should overflow mixed durations into next measure', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        { id: generateId(), type: 'note', duration: 'whole', notes: [{ pitch: 'C', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
        { id: generateId(), type: 'note', duration: 'half', notes: [{ pitch: 'D', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
        { id: generateId(), type: 'note', duration: 'quarter', notes: [{ pitch: 'E', octave: 4, clef: 'treble' }], position: { measureIndex: 0, beatPosition: 0 } },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Whole note fills measure 0, half note starts measure 1, quarter continues in measure 1
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.events[1].position).toEqual({ measureIndex: 1, beatPosition: 0 })
      expect(result.events[2].position).toEqual({ measureIndex: 1, beatPosition: 2 })
      expect(result.measures).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('should handle empty score', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      expect(result.events).toHaveLength(0)
      expect(result.measures).toHaveLength(0)
    })

    it('should handle single note', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      expect(result.events).toHaveLength(1)
      expect(result.events[0].position).toEqual({ measureIndex: 0, beatPosition: 0 })
      expect(result.measures).toHaveLength(1)
    })

    it('should preserve event IDs and notes', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const eventId = generateId()
      const events: MusicalEvent[] = [
        {
          id: eventId,
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble', accidental: 'sharp' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      const firstEvent = result.events[0]
      expect(firstEvent).toBeDefined()
      expect(firstEvent?.id).toBe(eventId)
      expect(firstEvent?.notes?.[0]).toEqual({ pitch: 'C', octave: 4, clef: 'treble', accidental: 'sharp' })
    })

    it('should update metadata', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = [
        {
          id: generateId(),
          type: 'note',
          duration: 'quarter',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Metadata should exist and have modifiedAt
      expect(result.metadata).toBeDefined()
      expect(result.metadata.modifiedAt).toBeDefined()
      expect(typeof result.metadata.modifiedAt).toBe('string')
    })
  })

  describe('measure structure', () => {
    it('should build correct measure structure', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      const events: MusicalEvent[] = Array.from({ length: 6 }, (_, i) => ({
        id: `note-${i}`,
        type: 'note' as const,
        duration: 'quarter' as const,
        notes: [{ pitch: 'C', octave: 4, clef: 'treble' as const }],
        position: { measureIndex: 0, beatPosition: 0 },
      }))

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      expect(result.measures).toHaveLength(2)

      // First measure should have 4 events
      expect(result.measures[0].events).toHaveLength(4)
      expect(result.measures[0].events).toEqual(['note-0', 'note-1', 'note-2', 'note-3'])
      expect(result.measures[0].timeSignature).toEqual(timeSignature)

      // Second measure should have 2 events
      expect(result.measures[1].events).toHaveLength(2)
      expect(result.measures[1].events).toEqual(['note-4', 'note-5'])
      expect(result.measures[1].timeSignature).toEqual(timeSignature)
    })

    it('should clear beam groups', () => {
      const timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
      const score = createEmptyScore(timeSignature)

      // Add some beam groups
      score.beamGroups = [
        { id: 'beam-1', type: 'beam', eventIds: ['note-1', 'note-2'] },
      ]

      const events: MusicalEvent[] = [
        {
          id: 'note-1',
          type: 'note',
          duration: 'eighth',
          notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
          position: { measureIndex: 0, beatPosition: 0 },
        },
      ]

      score.events = events

      const result = recalculateScoreForTimeSignature(score, timeSignature)

      // Beam groups should be cleared (will be recalculated by caller)
      expect(result.beamGroups).toEqual([])
    })
  })
})
