import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Keyboard.css'
import type { NoteDuration } from '../types/music'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface Note {
  name: string
  frequency: number
  key: string
  isBlack?: boolean
}

interface KeyboardProps {
  onNotePlay: (notes: string[], clef: 'treble' | 'bass') => void
  activeNotes?: Set<string>
  currentDuration: NoteDuration
  onDurationChange: (duration: NoteDuration) => void
  showTrebleClef?: boolean
  showBassClef?: boolean
}

const Keyboard = ({
  onNotePlay,
  activeNotes = new Set(),
  currentDuration,
  onDurationChange,
  showTrebleClef = true,
  showBassClef = true,
}: KeyboardProps) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const onNotePlayRef = useRef(onNotePlay)
  const [keyDimensions, setKeyDimensions] = useState({ whiteKeyWidth: 60, blackKeyWidth: 40 })
  const [selectedClef, setSelectedClef] = useState<'treble' | 'bass'>('treble')

  // Chord detection state
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [pendingNotes, setPendingNotes] = useState<Array<{ name: string; frequency: number; clef: 'treble' | 'bass' }>>([])
  const chordTimerRef = useRef<number | null>(null)
  const CHORD_WINDOW_MS = 150

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
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      // Clear chord timer on unmount
      if (chordTimerRef.current !== null) {
        clearTimeout(chordTimerRef.current)
      }
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

      // Call parent handler with array of notes
      onNotePlayRef.current(noteNames, clef)

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

  // Note frequencies for treble clef (C4 to C7 - 3 octaves)
  const trebleNotes: Note[] = useMemo(() => [
    // First octave (C4 to B4)
    { name: 'C4', frequency: 261.63, key: 'a' },
    { name: 'C#4', frequency: 277.18, key: 'w', isBlack: true },
    { name: 'D4', frequency: 293.66, key: 's' },
    { name: 'D#4', frequency: 311.13, key: 'e', isBlack: true },
    { name: 'E4', frequency: 329.63, key: 'd' },
    { name: 'F4', frequency: 349.23, key: 'f' },
    { name: 'F#4', frequency: 369.99, key: 't', isBlack: true },
    { name: 'G4', frequency: 392.00, key: 'g' },
    { name: 'G#4', frequency: 415.30, key: 'y', isBlack: true },
    { name: 'A4', frequency: 440.00, key: 'h' },
    { name: 'A#4', frequency: 466.16, key: 'u', isBlack: true },
    { name: 'B4', frequency: 493.88, key: 'j' },
    // Second octave (C5 to B5)
    { name: 'C5', frequency: 523.25, key: 'k' },
    { name: 'C#5', frequency: 554.37, key: 'o', isBlack: true },
    { name: 'D5', frequency: 587.33, key: 'l' },
    { name: 'D#5', frequency: 622.25, key: 'p', isBlack: true },
    { name: 'E5', frequency: 659.25, key: ';' },
    { name: 'F5', frequency: 698.46, key: 'z' },
    { name: 'F#5', frequency: 739.99, key: 'x', isBlack: true },
    { name: 'G5', frequency: 783.99, key: 'c' },
    { name: 'G#5', frequency: 830.61, key: 'v', isBlack: true },
    { name: 'A5', frequency: 880.00, key: 'b' },
    { name: 'A#5', frequency: 932.33, key: 'n', isBlack: true },
    { name: 'B5', frequency: 987.77, key: 'm' },
    // Third octave (C6 to C7)
    { name: 'C6', frequency: 1046.50, key: ',' },
    { name: 'C#6', frequency: 1108.73, key: '1', isBlack: true },
    { name: 'D6', frequency: 1174.66, key: '.' },
    { name: 'D#6', frequency: 1244.51, key: '2', isBlack: true },
    { name: 'E6', frequency: 1318.51, key: '/' },
    { name: 'F6', frequency: 1396.91, key: 'q' },
    { name: 'F#6', frequency: 1479.98, key: '3', isBlack: true },
    { name: 'G6', frequency: 1567.98, key: 'r' },
    { name: 'G#6', frequency: 1661.22, key: '4', isBlack: true },
    { name: 'A6', frequency: 1760.00, key: 'i' },
    { name: 'A#6', frequency: 1864.66, key: '5', isBlack: true },
    { name: 'B6', frequency: 1975.53, key: '[' },
    { name: 'C7', frequency: 2093.00, key: ']' },
  ], [])

  // Note frequencies for bass clef (C2 to C5 - 3 octaves)
  const bassNotes: Note[] = useMemo(() => [
    // First octave (C2 to B2)
    { name: 'C2', frequency: 65.41, key: 'a' },
    { name: 'C#2', frequency: 69.30, key: 'w', isBlack: true },
    { name: 'D2', frequency: 73.42, key: 's' },
    { name: 'D#2', frequency: 77.78, key: 'e', isBlack: true },
    { name: 'E2', frequency: 82.41, key: 'd' },
    { name: 'F2', frequency: 87.31, key: 'f' },
    { name: 'F#2', frequency: 92.50, key: 't', isBlack: true },
    { name: 'G2', frequency: 98.00, key: 'g' },
    { name: 'G#2', frequency: 103.83, key: 'y', isBlack: true },
    { name: 'A2', frequency: 110.00, key: 'h' },
    { name: 'A#2', frequency: 116.54, key: 'u', isBlack: true },
    { name: 'B2', frequency: 123.47, key: 'j' },
    // Second octave (C3 to B3)
    { name: 'C3', frequency: 130.81, key: 'k' },
    { name: 'C#3', frequency: 138.59, key: 'o', isBlack: true },
    { name: 'D3', frequency: 146.83, key: 'l' },
    { name: 'D#3', frequency: 155.56, key: 'p', isBlack: true },
    { name: 'E3', frequency: 164.81, key: ';' },
    { name: 'F3', frequency: 174.61, key: 'z' },
    { name: 'F#3', frequency: 185.00, key: 'x', isBlack: true },
    { name: 'G3', frequency: 196.00, key: 'c' },
    { name: 'G#3', frequency: 207.65, key: 'v', isBlack: true },
    { name: 'A3', frequency: 220.00, key: 'b' },
    { name: 'A#3', frequency: 233.08, key: 'n', isBlack: true },
    { name: 'B3', frequency: 246.94, key: 'm' },
    // Third octave (C4 to C5)
    { name: 'C4', frequency: 261.63, key: ',' },
    { name: 'C#4', frequency: 277.18, key: '1', isBlack: true },
    { name: 'D4', frequency: 293.66, key: '.' },
    { name: 'D#4', frequency: 311.13, key: '2', isBlack: true },
    { name: 'E4', frequency: 329.63, key: '/' },
    { name: 'F4', frequency: 349.23, key: 'q' },
    { name: 'F#4', frequency: 369.99, key: '3', isBlack: true },
    { name: 'G4', frequency: 392.00, key: 'r' },
    { name: 'G#4', frequency: 415.30, key: '4', isBlack: true },
    { name: 'A4', frequency: 440.00, key: 'i' },
    { name: 'A#4', frequency: 466.16, key: '5', isBlack: true },
    { name: 'B4', frequency: 493.88, key: '[' },
    { name: 'C5', frequency: 523.25, key: ']' },
  ], [])

  // Select notes based on selected clef
  const notes = selectedClef === 'treble' ? trebleNotes : bassNotes

  const playNote = useCallback((frequency: number, noteName: string) => {
    const audioContext = getAudioContext()
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)

    // Add note to pending buffer
    setPendingNotes(prev => {
      const newPending = [...prev, { name: noteName, frequency, clef: selectedClef }]

      // Only start timer if this is the first note in the buffer
      if (prev.length === 0) {
        // Start the chord detection window
        chordTimerRef.current = window.setTimeout(() => {
          commitPendingNotes()
        }, CHORD_WINDOW_MS)
      }
      // Otherwise, just add to the buffer (don't restart timer)

      return newPending
    })
  }, [selectedClef, getAudioContext, CHORD_WINDOW_MS, commitPendingNotes]);

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
        // Track pressed key
        setPressedKeys(prev => new Set([...prev, key]))

        playNote(note.frequency, note.name)

        // Add visual feedback
        const button = document.querySelector(`[data-key="${key}"]`)
        if (button) {
          button.classList.add('active')
          setTimeout(() => button.classList.remove('active'), 200)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

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
  }, [notes, selectedClef, playNote, commitPendingNotes])

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
          <div className="duration-control">
            <Select
              value={currentDuration}
              onValueChange={(value) => onDurationChange(value as NoteDuration)}
            >
              <SelectTrigger id="keyboard-duration" className="w-[130px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole">Whole</SelectItem>
                <SelectItem value="half">Half</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="eighth">Eighth</SelectItem>
                <SelectItem value="sixteenth">Sixteenth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="keyboard" ref={keyboardRef}>
        {/* Render white keys */}
        {whiteNotes.map(note => (
          <button
            key={note.name}
            data-key={note.key}
            className={`piano-key white ${activeNotes.has(note.name) ? 'active' : ''}`}
            onClick={() => playNote(note.frequency, note.name)}
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
            onClick={() => playNote(note.frequency, note.name)}
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
