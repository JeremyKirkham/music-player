import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDurationInSeconds,
  getDurationInBeats,
  getNoteFrequency,
  scheduleEvents,
  playNoteSound,
} from './playbackUtilities'
import type { MusicalEvent, Note } from '../types/music'

describe('playbackUtilities', () => {
  describe('getDurationInSeconds', () => {
    it('should calculate whole note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('whole', 120)
      expect(duration).toBe(2) // 4 beats * 0.5 seconds per beat
    })

    it('should calculate half note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('half', 120)
      expect(duration).toBe(1) // 2 beats * 0.5 seconds per beat
    })

    it('should calculate quarter note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('quarter', 120)
      expect(duration).toBe(0.5) // 1 beat * 0.5 seconds per beat
    })

    it('should calculate eighth note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('eighth', 120)
      expect(duration).toBe(0.25) // 0.5 beats * 0.5 seconds per beat
    })

    it('should calculate sixteenth note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('sixteenth', 120)
      expect(duration).toBe(0.125) // 0.25 beats * 0.5 seconds per beat
    })

    it('should calculate dotted half note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('dotted-half', 120)
      expect(duration).toBe(1.5) // 3 beats * 0.5 seconds per beat
    })

    it('should calculate dotted quarter note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('dotted-quarter', 120)
      expect(duration).toBe(0.75) // 1.5 beats * 0.5 seconds per beat
    })

    it('should calculate dotted eighth note duration at 120 BPM', () => {
      const duration = getDurationInSeconds('dotted-eighth', 120)
      expect(duration).toBe(0.375) // 0.75 beats * 0.5 seconds per beat
    })

    it('should use default BPM of 120 when not provided', () => {
      const duration = getDurationInSeconds('quarter')
      expect(duration).toBe(0.5)
    })

    it('should calculate correctly at 60 BPM', () => {
      const duration = getDurationInSeconds('quarter', 60)
      expect(duration).toBe(1) // 1 beat * 1 second per beat
    })

    it('should calculate correctly at 240 BPM', () => {
      const duration = getDurationInSeconds('quarter', 240)
      expect(duration).toBe(0.25) // 1 beat * 0.25 seconds per beat
    })
  })

  describe('getDurationInBeats', () => {
    it('should return 4 beats for whole note', () => {
      expect(getDurationInBeats('whole')).toBe(4)
    })

    it('should return 2 beats for half note', () => {
      expect(getDurationInBeats('half')).toBe(2)
    })

    it('should return 1 beat for quarter note', () => {
      expect(getDurationInBeats('quarter')).toBe(1)
    })

    it('should return 0.5 beats for eighth note', () => {
      expect(getDurationInBeats('eighth')).toBe(0.5)
    })

    it('should return 0.25 beats for sixteenth note', () => {
      expect(getDurationInBeats('sixteenth')).toBe(0.25)
    })

    it('should return 3 beats for dotted half note', () => {
      expect(getDurationInBeats('dotted-half')).toBe(3)
    })

    it('should return 1.5 beats for dotted quarter note', () => {
      expect(getDurationInBeats('dotted-quarter')).toBe(1.5)
    })

    it('should return 0.75 beats for dotted eighth note', () => {
      expect(getDurationInBeats('dotted-eighth')).toBe(0.75)
    })
  })

  describe('getNoteFrequency', () => {
    it('should return correct frequency for C4', () => {
      const note: Note = { pitch: 'C', octave: 4, clef: 'treble' }
      expect(getNoteFrequency(note)).toBe(261.63)
    })

    it('should return correct frequency for A4', () => {
      const note: Note = { pitch: 'A', octave: 4, clef: 'treble' }
      expect(getNoteFrequency(note)).toBe(440.00)
    })

    it('should return correct frequency for C#4 (sharp)', () => {
      const note: Note = { pitch: 'C', octave: 4, clef: 'treble', accidental: 'sharp' }
      expect(getNoteFrequency(note)).toBe(277.18)
    })

    it('should return correct frequency for Db4 (flat)', () => {
      const note: Note = { pitch: 'D', octave: 4, clef: 'treble', accidental: 'flat' }
      expect(getNoteFrequency(note)).toBe(277.18)
    })

    it('should return correct frequency for C5', () => {
      const note: Note = { pitch: 'C', octave: 5, clef: 'treble' }
      expect(getNoteFrequency(note)).toBe(523.25)
    })

    it('should return correct frequency for C6', () => {
      const note: Note = { pitch: 'C', octave: 6, clef: 'treble' }
      expect(getNoteFrequency(note)).toBe(1046.50)
    })

    it('should return correct frequency for C7', () => {
      const note: Note = { pitch: 'C', octave: 7, clef: 'treble' }
      expect(getNoteFrequency(note)).toBe(2093.00)
    })

    it('should return default frequency (440) for unknown note', () => {
      const note: Note = { pitch: 'C', octave: 10, clef: 'treble' }
      expect(getNoteFrequency(note)).toBe(440)
    })

    it('should handle natural accidental', () => {
      const note: Note = { pitch: 'C', octave: 4, clef: 'treble', accidental: 'natural' }
      expect(getNoteFrequency(note)).toBe(261.63)
    })

    it('should return correct frequency for G#5', () => {
      const note: Note = { pitch: 'G', octave: 5, clef: 'treble', accidental: 'sharp' }
      expect(getNoteFrequency(note)).toBe(830.61)
    })

    it('should return correct frequency for Bb5', () => {
      const note: Note = { pitch: 'B', octave: 5, clef: 'treble', accidental: 'flat' }
      expect(getNoteFrequency(note)).toBe(932.33)
    })
  })

  describe('scheduleEvents', () => {
    const createEvent = (
      id: string,
      duration: string,
      measureIndex: number,
      beatPosition: number
    ): MusicalEvent => ({
      id,
      type: 'note',
      duration: duration as MusicalEvent['duration'],
      notes: [{ pitch: 'C', octave: 4, clef: 'treble' }],
      position: { measureIndex, beatPosition },
    })

    it('should schedule a single quarter note at measure 0, beat 0', () => {
      const events = [createEvent('e1', 'quarter', 0, 0)]
      const scheduled = scheduleEvents(events, 4, 120)

      expect(scheduled).toHaveLength(1)
      expect(scheduled[0].startTime).toBe(0)
      expect(scheduled[0].duration).toBe(0.5) // quarter note at 120 BPM
      expect(scheduled[0].event.id).toBe('e1')
    })

    it('should schedule two consecutive quarter notes', () => {
      const events = [
        createEvent('e1', 'quarter', 0, 0),
        createEvent('e2', 'quarter', 0, 1),
      ]
      const scheduled = scheduleEvents(events, 4, 120)

      expect(scheduled).toHaveLength(2)
      expect(scheduled[0].startTime).toBe(0)
      expect(scheduled[1].startTime).toBe(0.5) // 1 beat later at 120 BPM
    })

    it('should schedule notes across multiple measures', () => {
      const events = [
        createEvent('e1', 'quarter', 0, 0),
        createEvent('e2', 'quarter', 1, 0),
      ]
      const scheduled = scheduleEvents(events, 4, 120)

      expect(scheduled).toHaveLength(2)
      expect(scheduled[0].startTime).toBe(0)
      expect(scheduled[1].startTime).toBe(2) // 4 beats later at 120 BPM (0.5s per beat)
    })

    it('should handle different tempos correctly', () => {
      const events = [
        createEvent('e1', 'quarter', 0, 0),
        createEvent('e2', 'quarter', 0, 1),
      ]
      const scheduled = scheduleEvents(events, 4, 60)

      expect(scheduled[0].startTime).toBe(0)
      expect(scheduled[1].startTime).toBe(1) // 1 beat later at 60 BPM (1s per beat)
    })

    it('should sort events by position before scheduling', () => {
      const events = [
        createEvent('e2', 'quarter', 0, 1),
        createEvent('e1', 'quarter', 0, 0),
        createEvent('e3', 'quarter', 1, 0),
      ]
      const scheduled = scheduleEvents(events, 4, 120)

      expect(scheduled[0].event.id).toBe('e1')
      expect(scheduled[1].event.id).toBe('e2')
      expect(scheduled[2].event.id).toBe('e3')
    })

    it('should handle fractional beat positions', () => {
      const events = [
        createEvent('e1', 'eighth', 0, 0),
        createEvent('e2', 'eighth', 0, 0.5),
      ]
      const scheduled = scheduleEvents(events, 4, 120)

      expect(scheduled[0].startTime).toBe(0)
      expect(scheduled[1].startTime).toBe(0.25) // 0.5 beats later at 120 BPM
    })

    it('should calculate durations based on note duration', () => {
      const events = [
        createEvent('e1', 'whole', 0, 0),
        createEvent('e2', 'half', 1, 0),
        createEvent('e3', 'quarter', 2, 0),
        createEvent('e4', 'eighth', 3, 0),
      ]
      const scheduled = scheduleEvents(events, 4, 120)

      expect(scheduled[0].duration).toBe(2) // whole note
      expect(scheduled[1].duration).toBe(1) // half note
      expect(scheduled[2].duration).toBe(0.5) // quarter note
      expect(scheduled[3].duration).toBe(0.25) // eighth note
    })

    it('should handle empty events array', () => {
      const scheduled = scheduleEvents([], 4, 120)
      expect(scheduled).toHaveLength(0)
    })

    it('should handle different time signatures', () => {
      const events = [
        createEvent('e1', 'quarter', 0, 0),
        createEvent('e2', 'quarter', 1, 0),
      ]
      const scheduled = scheduleEvents(events, 3, 120) // 3/4 time

      expect(scheduled[0].startTime).toBe(0)
      expect(scheduled[1].startTime).toBe(1.5) // 3 beats later at 120 BPM
    })
  })

  describe('playNoteSound', () => {
    let mockAudioContext: {
      createOscillator: ReturnType<typeof vi.fn>
      createGain: ReturnType<typeof vi.fn>
      destination: AudioDestinationNode
      currentTime: number
    }
    let mockOscillator: {
      connect: ReturnType<typeof vi.fn>
      start: ReturnType<typeof vi.fn>
      stop: ReturnType<typeof vi.fn>
      frequency: { value: number }
      type: OscillatorType
    }
    let mockGainNode: {
      connect: ReturnType<typeof vi.fn>
      gain: {
        setValueAtTime: ReturnType<typeof vi.fn>
        exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
      }
    }

    beforeEach(() => {
      mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: 'sine',
      }

      mockGainNode = {
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      }

      mockAudioContext = {
        createOscillator: vi.fn(() => mockOscillator as unknown as OscillatorNode),
        createGain: vi.fn(() => mockGainNode as unknown as GainNode),
        destination: {} as AudioDestinationNode,
        currentTime: 0,
      }
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should create oscillator and gain nodes', () => {
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5)

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should connect oscillator to gain node and destination', () => {
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5)

      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode)
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination)
    })

    it('should set frequency correctly', () => {
      playNoteSound(mockAudioContext as unknown as AudioContext, 523.25, 0.5)

      expect(mockOscillator.frequency.value).toBe(523.25)
    })

    it('should set oscillator type to sine', () => {
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5)

      expect(mockOscillator.type).toBe('sine')
    })

    it('should start oscillator immediately when startTime is 0', () => {
      mockAudioContext.currentTime = 1.5
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5, 0)

      expect(mockOscillator.start).toHaveBeenCalledWith(1.5)
    })

    it('should start oscillator at specified time in the future', () => {
      mockAudioContext.currentTime = 1.0
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5, 0.5)

      expect(mockOscillator.start).toHaveBeenCalledWith(1.5)
    })

    it('should stop oscillator after duration', () => {
      mockAudioContext.currentTime = 1.0
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5, 0)

      expect(mockOscillator.stop).toHaveBeenCalledWith(1.5)
    })

    it('should limit maximum duration to 0.5 seconds', () => {
      mockAudioContext.currentTime = 1.0
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 2.0, 0)

      expect(mockOscillator.stop).toHaveBeenCalledWith(1.5) // currentTime + 0.5
    })

    it('should set gain envelope correctly', () => {
      mockAudioContext.currentTime = 1.0
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5, 0)

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 1.0)
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 1.5)
    })

    it('should handle scheduled playback', () => {
      mockAudioContext.currentTime = 0
      playNoteSound(mockAudioContext as unknown as AudioContext, 440, 0.5, 1.0)

      expect(mockOscillator.start).toHaveBeenCalledWith(1.0)
      expect(mockOscillator.stop).toHaveBeenCalledWith(1.5)
    })
  })
})
