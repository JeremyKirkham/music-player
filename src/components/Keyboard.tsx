import { useCallback, useEffect, useRef, useState } from 'react'
import './Keyboard.css'
import type { NoteDuration } from '../types/music'
import { getDurationInBeats } from '../utils/playbackUtilities'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

// Duration progression based on hold time
const getDurationFromHoldTime = (holdTimeMs: number): NoteDuration => {
  if (holdTimeMs < 50) return 'sixteenth'      // 0-49ms
  if (holdTimeMs < 150) return 'eighth'        // 50-149ms
  if (holdTimeMs < 300) return 'quarter'       // 150-299ms
  if (holdTimeMs < 700) return 'half'          // 300-699ms
  return 'whole'                               // 700ms+
}

interface Note {
  name: string
  frequency: number
  key: string
  isBlack?: boolean
}

// Keyboard layout - shared keys across both clefs
const KEYS = {
  oct1: ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j'],
  oct2: ['k', 'o', 'l', 'p', ';', 'z', 'x', 'c', 'v', 'b', 'n', 'm'],
  oct3: [',', '1', '.', '2', '/', 'q', '3', 'r', '4', 'i', '5', '['],
  final: ']',
}

// Shared octave definitions
const C4_OCTAVE: Note[] = [
  { name: 'C4', frequency: 261.63, key: KEYS.oct1[0] },
  { name: 'C#4', frequency: 277.18, key: KEYS.oct1[1], isBlack: true },
  { name: 'D4', frequency: 293.66, key: KEYS.oct1[2] },
  { name: 'D#4', frequency: 311.13, key: KEYS.oct1[3], isBlack: true },
  { name: 'E4', frequency: 329.63, key: KEYS.oct1[4] },
  { name: 'F4', frequency: 349.23, key: KEYS.oct1[5] },
  { name: 'F#4', frequency: 369.99, key: KEYS.oct1[6], isBlack: true },
  { name: 'G4', frequency: 392.00, key: KEYS.oct1[7] },
  { name: 'G#4', frequency: 415.30, key: KEYS.oct1[8], isBlack: true },
  { name: 'A4', frequency: 440.00, key: KEYS.oct1[9] },
  { name: 'A#4', frequency: 466.16, key: KEYS.oct1[10], isBlack: true },
  { name: 'B4', frequency: 493.88, key: KEYS.oct1[11] },
]

// For bass clef, map C4 octave to oct3 keys
const C4_OCTAVE_BASS: Note[] = C4_OCTAVE.map((oc, index) => ({
  ...oc, key: KEYS.oct3[index]
}));

// Treble clef notes (C4 to C7)
const TREBLE_NOTES: Note[] = [
  // C4 octave
  ...C4_OCTAVE,
  // C5 octave
  { name: 'C5', frequency: 523.25, key: KEYS.oct2[0] },
  { name: 'C#5', frequency: 554.37, key: KEYS.oct2[1], isBlack: true },
  { name: 'D5', frequency: 587.33, key: KEYS.oct2[2] },
  { name: 'D#5', frequency: 622.25, key: KEYS.oct2[3], isBlack: true },
  { name: 'E5', frequency: 659.25, key: KEYS.oct2[4] },
  { name: 'F5', frequency: 698.46, key: KEYS.oct2[5] },
  { name: 'F#5', frequency: 739.99, key: KEYS.oct2[6], isBlack: true },
  { name: 'G5', frequency: 783.99, key: KEYS.oct2[7] },
  { name: 'G#5', frequency: 830.61, key: KEYS.oct2[8], isBlack: true },
  { name: 'A5', frequency: 880.00, key: KEYS.oct2[9] },
  { name: 'A#5', frequency: 932.33, key: KEYS.oct2[10], isBlack: true },
  { name: 'B5', frequency: 987.77, key: KEYS.oct2[11] },
  // C6 octave
  { name: 'C6', frequency: 1046.50, key: KEYS.oct3[0] },
  { name: 'C#6', frequency: 1108.73, key: KEYS.oct3[1], isBlack: true },
  { name: 'D6', frequency: 1174.66, key: KEYS.oct3[2] },
  { name: 'D#6', frequency: 1244.51, key: KEYS.oct3[3], isBlack: true },
  { name: 'E6', frequency: 1318.51, key: KEYS.oct3[4] },
  { name: 'F6', frequency: 1396.91, key: KEYS.oct3[5] },
  { name: 'F#6', frequency: 1479.98, key: KEYS.oct3[6], isBlack: true },
  { name: 'G6', frequency: 1567.98, key: KEYS.oct3[7] },
  { name: 'G#6', frequency: 1661.22, key: KEYS.oct3[8], isBlack: true },
  { name: 'A6', frequency: 1760.00, key: KEYS.oct3[9] },
  { name: 'A#6', frequency: 1864.66, key: KEYS.oct3[10], isBlack: true },
  { name: 'B6', frequency: 1975.53, key: KEYS.oct3[11] },
  // C7
  { name: 'C7', frequency: 2093.00, key: KEYS.final },
]

// Bass clef notes (C2 to C5)
const BASS_NOTES: Note[] = [
  // C2 octave
  { name: 'C2', frequency: 65.41, key: KEYS.oct1[0] },
  { name: 'C#2', frequency: 69.30, key: KEYS.oct1[1], isBlack: true },
  { name: 'D2', frequency: 73.42, key: KEYS.oct1[2] },
  { name: 'D#2', frequency: 77.78, key: KEYS.oct1[3], isBlack: true },
  { name: 'E2', frequency: 82.41, key: KEYS.oct1[4] },
  { name: 'F2', frequency: 87.31, key: KEYS.oct1[5] },
  { name: 'F#2', frequency: 92.50, key: KEYS.oct1[6], isBlack: true },
  { name: 'G2', frequency: 98.00, key: KEYS.oct1[7] },
  { name: 'G#2', frequency: 103.83, key: KEYS.oct1[8], isBlack: true },
  { name: 'A2', frequency: 110.00, key: KEYS.oct1[9] },
  { name: 'A#2', frequency: 116.54, key: KEYS.oct1[10], isBlack: true },
  { name: 'B2', frequency: 123.47, key: KEYS.oct1[11] },
  // C3 octave
  { name: 'C3', frequency: 130.81, key: KEYS.oct2[0] },
  { name: 'C#3', frequency: 138.59, key: KEYS.oct2[1], isBlack: true },
  { name: 'D3', frequency: 146.83, key: KEYS.oct2[2] },
  { name: 'D#3', frequency: 155.56, key: KEYS.oct2[3], isBlack: true },
  { name: 'E3', frequency: 164.81, key: KEYS.oct2[4] },
  { name: 'F3', frequency: 174.61, key: KEYS.oct2[5] },
  { name: 'F#3', frequency: 185.00, key: KEYS.oct2[6], isBlack: true },
  { name: 'G3', frequency: 196.00, key: KEYS.oct2[7] },
  { name: 'G#3', frequency: 207.65, key: KEYS.oct2[8], isBlack: true },
  { name: 'A3', frequency: 220.00, key: KEYS.oct2[9] },
  { name: 'A#3', frequency: 233.08, key: KEYS.oct2[10], isBlack: true },
  { name: 'B3', frequency: 246.94, key: KEYS.oct2[11] },
  // C4 octave
  ...C4_OCTAVE_BASS,
  // C5
  { name: 'C5', frequency: 523.25, key: KEYS.final },
]

interface KeyboardProps {
  onNotePlay: (notes: string[], clef: 'treble' | 'bass', duration: NoteDuration) => void
  activeNotes?: Set<string>
  showTrebleClef?: boolean
  showBassClef?: boolean
}

const Keyboard = ({
  onNotePlay,
  activeNotes = new Set(),
  showTrebleClef = true,
  showBassClef = true,
}: KeyboardProps) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const onNotePlayRef = useRef(onNotePlay)
  const [keyDimensions, setKeyDimensions] = useState({ whiteKeyWidth: 60, blackKeyWidth: 40 })
  const [selectedClef, setSelectedClef] = useState<'treble' | 'bass'>('treble')

  // Chord detection state
  const [_pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [_pendingNotes, setPendingNotes] = useState<Array<{ name: string; frequency: number; clef: 'treble' | 'bass'; duration: NoteDuration }>>([])
  const chordTimerRef = useRef<number | null>(null)
  const CHORD_WINDOW_MS = 150

  // Hold duration tracking state
  const keyHoldTimersRef = useRef<Map<string, number>>(new Map())
  const keyHoldStartTimesRef = useRef<Map<string, number>>(new Map())
  const [keyHoldDurations, setKeyHoldDurations] = useState<Map<string, NoteDuration>>(new Map())

  // Active oscillators for sustained playback
  const activeOscillatorsRef = useRef<Map<string, { oscillator: OscillatorNode; gainNode: GainNode }>>(new Map())

  // Auto-switch to visible clef if current one is hidden
  useEffect(() => {
    if (!showTrebleClef && selectedClef === 'treble' && showBassClef) {
      setSelectedClef('bass')
    } else if (!showBassClef && selectedClef === 'bass' && showTrebleClef) {
      setSelectedClef('treble')
    }
  }, [showTrebleClef, showBassClef, selectedClef])

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onNotePlayRef.current = onNotePlay
  }, [onNotePlay])

  // Initialize audio context lazily (iOS Safari requires user gesture)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass()
        }
      } catch (error) {
        console.error('Failed to create AudioContext:', error)
      }
    }
    return audioContextRef.current
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    // Capture refs at mount time for cleanup
    const audioContext = audioContextRef.current
    const chordTimer = chordTimerRef
    const holdTimers = keyHoldTimersRef
    const activeOscillators = activeOscillatorsRef

    return () => {
      if (audioContext) {
        audioContext.close()
      }
      // Clear chord timer on unmount
      if (chordTimer.current !== null) {
        clearTimeout(chordTimer.current)
      }
      // Clear all hold duration timers
      holdTimers.current.forEach((timerId) => {
        clearInterval(timerId)
      })
      holdTimers.current.clear()

      // Stop all active oscillators
      activeOscillators.current.forEach(({ oscillator }) => {
        try {
          oscillator.stop()
        } catch {
          // Ignore if already stopped
        }
      })
      activeOscillators.current.clear()
    }
  }, [])

  // Commit pending notes as a chord or single note
  const commitPendingNotes = useCallback(() => {
    // Use a ref to get the current pending notes state
    // This ensures we get the latest value even when called from timeouts
    setPendingNotes(currentPending => {
      if (currentPending.length === 0) return currentPending

      // Extract note names from buffer
      const noteNames = currentPending.map(n => n.name)

      // All notes in a chord should use the same clef (the one selected when first key was pressed)
      const clef = currentPending[0].clef

      // For chords, use the shortest duration (most conservative)
      // This ensures the chord ends when the first key is released
      const finalDuration = currentPending.reduce((shortest, current) => {
        return getDurationInBeats(current.duration) < getDurationInBeats(shortest)
          ? current.duration
          : shortest
      }, currentPending[0].duration)

      // Call parent handler with array of notes and calculated duration
      onNotePlayRef.current(noteNames, clef, finalDuration)

      // Clear the buffer by returning empty array
      return []
    })

    // Clear timer reference
    if (chordTimerRef.current !== null) {
      clearTimeout(chordTimerRef.current)
      chordTimerRef.current = null
    }
  }, [])

  // Update key dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (keyboardRef.current) {
        const whiteKey = keyboardRef.current.querySelector('.piano-key.white')
        const blackKey = keyboardRef.current.querySelector('.piano-key.black')

        if (whiteKey && blackKey) {
          const whiteKeyWidth = whiteKey.getBoundingClientRect().width
          const blackKeyWidth = blackKey.getBoundingClientRect().width
          setKeyDimensions({ whiteKeyWidth, blackKeyWidth })
        }
      }
    }

    // Initial measurement
    updateDimensions()

    // Update on window resize
    window.addEventListener('resize', updateDimensions)

    // Use ResizeObserver for more accurate updates (if available)
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && keyboardRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(keyboardRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateDimensions)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  // Select notes based on selected clef
  const notes = selectedClef === 'treble' ? TREBLE_NOTES : BASS_NOTES

  const playNote = useCallback((frequency: number, key: string) => {
    const audioContext = getAudioContext()
    if (!audioContext) return

    // Stop any existing oscillator for this key
    const existing = activeOscillatorsRef.current.get(key)
    if (existing) {
      try {
        existing.oscillator.stop()
      } catch {
        // Ignore if already stopped
      }
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

    oscillator.start(audioContext.currentTime)

    // Store the oscillator so we can stop it on key release
    activeOscillatorsRef.current.set(key, { oscillator, gainNode })
  }, [getAudioContext]);

  const stopNote = useCallback((key: string) => {
    const active = activeOscillatorsRef.current.get(key)
    if (!active) return

    const { oscillator, gainNode } = active
    const audioContext = getAudioContext()
    if (!audioContext) return

    // Fade out quickly
    try {
      gainNode.gain.cancelScheduledValues(audioContext.currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
      oscillator.stop(audioContext.currentTime + 0.05)
    } catch {
      // Ignore if already stopped
    }

    activeOscillatorsRef.current.delete(key)
  }, [getAudioContext]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore keyboard shortcuts with modifier keys
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return
      }

      const key = event.key.toLowerCase()
      const note = notes.find(n => n.key === key)

      if (note && !event.repeat) {
        const now = Date.now()

        // Track when key was pressed
        keyHoldStartTimesRef.current.set(key, now)

        // Initialize duration at shortest value
        setKeyHoldDurations(prev => new Map(prev).set(key, 'sixteenth'))

        // Track pressed key
        setPressedKeys(prev => new Set([...prev, key]))

        // Play audio immediately (pass key for tracking)
        playNote(note.frequency, key)

        // Start interval timer to update duration display
        // Check every 25ms for responsive feedback
        const timerId = window.setInterval(() => {
          const startTime = keyHoldStartTimesRef.current.get(key)
          if (startTime) {
            const holdTime = Date.now() - startTime
            const newDuration = getDurationFromHoldTime(holdTime)
            setKeyHoldDurations(prev => new Map(prev).set(key, newDuration))
          }
        }, 25)

        keyHoldTimersRef.current.set(key, timerId)

        // Add visual feedback
        const button = document.querySelector(`[data-key="${key}"]`)
        if (button) {
          button.classList.add('active')
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const note = notes.find(n => n.key === key)

      if (note) {
        // Calculate final held duration
        const startTime = keyHoldStartTimesRef.current.get(key)
        let finalDuration: NoteDuration = 'quarter' // default fallback

        if (startTime) {
          const holdTime = Date.now() - startTime
          finalDuration = getDurationFromHoldTime(holdTime)
        }

        // Add to pending notes buffer with calculated duration
        setPendingNotes(prev => {
          const newPending = [...prev, {
            name: note.name,
            frequency: note.frequency,
            clef: selectedClef,
            duration: finalDuration
          }]

          // Only start timer if this is the first note in the buffer
          if (prev.length === 0) {
            chordTimerRef.current = window.setTimeout(() => {
              commitPendingNotes()
            }, CHORD_WINDOW_MS)
          }

          return newPending
        })

        // Clean up timers and state for this key
        const timerId = keyHoldTimersRef.current.get(key)
        if (timerId) {
          clearInterval(timerId)
          keyHoldTimersRef.current.delete(key)
        }

        keyHoldStartTimesRef.current.delete(key)
        setKeyHoldDurations(prev => {
          const newMap = new Map(prev)
          newMap.delete(key)
          return newMap
        })

        // Stop the audio for this key
        stopNote(key)

        // Remove visual feedback
        const button = document.querySelector(`[data-key="${key}"]`)
        if (button) {
          button.classList.remove('active')
        }
      }

      // Remove key from pressed keys
      setPressedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)

        // If all keys are released, commit immediately
        if (newSet.size === 0) {
          // Use timeout to ensure state updates have been processed
          setTimeout(() => {
            commitPendingNotes()
          }, 0)
        }

        return newSet
      })
    }

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [notes, selectedClef, playNote, stopNote, commitPendingNotes])

  const whiteNotes = notes.filter(note => !note.isBlack)
  const blackNotes = notes.filter(note => note.isBlack)

  // Calculate position for black keys based on their position in the scale
  const getBlackKeyPosition = (noteName: string): number => {
    const { whiteKeyWidth, blackKeyWidth } = keyDimensions
    const gap = 2
    const keyboardPadding = 20

    // Map note names to their position after which white key (0-indexed)
    // The black key should be centered at the right edge of this white key
    const treblePositionMap: { [key: string]: number } = {
      'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
      'C#5': 7, 'D#5': 8, 'F#5': 10, 'G#5': 11, 'A#5': 12,
      'C#6': 14, 'D#6': 15, 'F#6': 17, 'G#6': 18, 'A#6': 19,
    }

    const bassPositionMap: { [key: string]: number } = {
      'C#2': 0, 'D#2': 1, 'F#2': 3, 'G#2': 4, 'A#2': 5,
      'C#3': 7, 'D#3': 8, 'F#3': 10, 'G#3': 11, 'A#3': 12,
      'C#4': 14, 'D#4': 15, 'F#4': 17, 'G#4': 18, 'A#4': 19,
    }

    const positionMap = selectedClef === 'treble' ? treblePositionMap : bassPositionMap
    const whiteKeyIndex = positionMap[noteName] || 0
    // Calculate the right edge of the white key and center the black key on it
    // Right edge = padding + (whiteKeyIndex + 1) * whiteKeyWidth + whiteKeyIndex * gap
    // Black key left position = right edge - half of black key width
    return keyboardPadding + (whiteKeyIndex + 1) * whiteKeyWidth + whiteKeyIndex * gap - (blackKeyWidth / 2)
  }

  const handleMouseDown = useCallback((note: Note) => {
    const now = Date.now()

    // Track when mouse was pressed
    keyHoldStartTimesRef.current.set(note.name, now)

    // Initialize duration at shortest value
    setKeyHoldDurations(prev => new Map(prev).set(note.name, 'sixteenth'))

    // Track pressed key
    setPressedKeys(prev => new Set([...prev, note.name]))

    // Play audio immediately
    playNote(note.frequency, note.name)

    // Start interval timer to update duration display
    const timerId = window.setInterval(() => {
      const startTime = keyHoldStartTimesRef.current.get(note.name)
      if (startTime) {
        const holdTime = Date.now() - startTime
        const newDuration = getDurationFromHoldTime(holdTime)
        setKeyHoldDurations(prev => new Map(prev).set(note.name, newDuration))
      }
    }, 25)

    keyHoldTimersRef.current.set(note.name, timerId)
  }, [playNote])

  const handleMouseUp = useCallback((note: Note) => {
    // Calculate final held duration
    const startTime = keyHoldStartTimesRef.current.get(note.name)
    let finalDuration: NoteDuration = 'quarter' // default fallback

    if (startTime) {
      const holdTime = Date.now() - startTime
      finalDuration = getDurationFromHoldTime(holdTime)
    }

    // Add to pending notes buffer with calculated duration
    setPendingNotes(prev => {
      const newPending = [...prev, {
        name: note.name,
        frequency: note.frequency,
        clef: selectedClef,
        duration: finalDuration
      }]

      // Only start timer if this is the first note in the buffer
      if (prev.length === 0) {
        chordTimerRef.current = window.setTimeout(() => {
          commitPendingNotes()
        }, CHORD_WINDOW_MS)
      }

      return newPending
    })

    // Clean up timers and state for this key
    const timerId = keyHoldTimersRef.current.get(note.name)
    if (timerId) {
      clearInterval(timerId)
      keyHoldTimersRef.current.delete(note.name)
    }

    keyHoldStartTimesRef.current.delete(note.name)
    setKeyHoldDurations(prev => {
      const newMap = new Map(prev)
      newMap.delete(note.name)
      return newMap
    })

    // Stop the audio
    stopNote(note.name)

    // Remove key from pressed keys
    setPressedKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(note.name)

      // If all keys are released, commit immediately
      if (newSet.size === 0) {
        setTimeout(() => {
          commitPendingNotes()
        }, 0)
      }

      return newSet
    })
  }, [selectedClef, stopNote, commitPendingNotes])

  return (
    <div className="keyboard-container">
      <div className="keyboard-header">
        <div className="keyboard-controls">
          <div className="clef-control">
            <Select
              value={selectedClef}
              onValueChange={(value) => setSelectedClef(value as 'treble' | 'bass')}
              disabled={!showTrebleClef || !showBassClef}
            >
              <SelectTrigger id="keyboard-clef" className="w-[120px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {showTrebleClef && <SelectItem value="treble">Treble</SelectItem>}
                {showBassClef && <SelectItem value="bass">Bass</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {keyHoldDurations.size > 0 && (
            <div className="duration-indicator">
              Hold Duration: <strong>{Array.from(keyHoldDurations.values())[0]}</strong>
            </div>
          )}
        </div>
      </div>
      <div className="keyboard" ref={keyboardRef}>
        {/* Render white keys */}
        {whiteNotes.map(note => (
          <button
            key={note.name}
            data-key={note.key}
            className={`piano-key white ${activeNotes.has(note.name) ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown(note)}
            onMouseUp={() => handleMouseUp(note)}
            onMouseLeave={() => {
              // Stop the note if mouse leaves while pressed
              if (keyHoldStartTimesRef.current.has(note.name)) {
                handleMouseUp(note)
              }
            }}
          >
            <span className="note-name">{note.name}</span>
            <span className="key-label">{note.key.toUpperCase()}</span>
          </button>
        ))}
        {/* Render black keys with absolute positioning */}
        {blackNotes.map(note => (
          <button
            key={note.name}
            data-key={note.key}
            className={`piano-key black ${activeNotes.has(note.name) ? 'active' : ''}`}
            style={{ left: `${getBlackKeyPosition(note.name)}px` }}
            onMouseDown={() => handleMouseDown(note)}
            onMouseUp={() => handleMouseUp(note)}
            onMouseLeave={() => {
              // Stop the note if mouse leaves while pressed
              if (keyHoldStartTimesRef.current.has(note.name)) {
                handleMouseUp(note)
              }
            }}
          >
            <span className="note-name">{note.name}</span>
            <span className="key-label">{note.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Keyboard
