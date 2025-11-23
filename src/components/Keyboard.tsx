import { useEffect, useMemo, useRef, useState } from 'react'
import './Keyboard.css'
import type { NoteDuration } from '../types/music'

interface Note {
  name: string
  frequency: number
  key: string
  isBlack?: boolean
}

interface KeyboardProps {
  onNotePlay: (note: string) => void
  activeNotes?: Set<string>
  currentDuration: NoteDuration
  onDurationChange: (duration: NoteDuration) => void
}

const Keyboard = ({ onNotePlay, activeNotes = new Set(), currentDuration, onDurationChange }: KeyboardProps) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const onNotePlayRef = useRef(onNotePlay)
  const [keyDimensions, setKeyDimensions] = useState({ whiteKeyWidth: 60, blackKeyWidth: 40 })

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onNotePlayRef.current = onNotePlay
  }, [onNotePlay])

  // Initialize audio context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    audioContextRef.current = new (AudioContextClass || AudioContext)()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
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

    // Use ResizeObserver for more accurate updates
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (keyboardRef.current) {
      resizeObserver.observe(keyboardRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateDimensions)
      resizeObserver.disconnect()
    }
  }, [])

  // Note frequencies (C4 to C7 - 3 octaves)
  const notes: Note[] = useMemo(() => [
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

  const playNote = (frequency: number, noteName: string) => {
    if (!audioContextRef.current) return

    const audioContext = audioContextRef.current
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

    // Use the ref to always call the latest callback
    onNotePlayRef.current(noteName)
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const note = notes.find(n => n.key === key)

      if (note && !event.repeat) {
        playNote(note.frequency, note.name)

        // Add visual feedback
        const button = document.querySelector(`[data-key="${key}"]`)
        if (button) {
          button.classList.add('active')
          setTimeout(() => button.classList.remove('active'), 200)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [notes])

  const whiteNotes = notes.filter(note => !note.isBlack)
  const blackNotes = notes.filter(note => note.isBlack)

  // Calculate position for black keys based on their position in the scale
  const getBlackKeyPosition = (noteName: string): number => {
    const { whiteKeyWidth, blackKeyWidth } = keyDimensions
    const gap = 2
    const keyboardPadding = 20

    // Map note names to their position after which white key (0-indexed)
    // The black key should be centered at the right edge of this white key
    const positionMap: { [key: string]: number } = {
      'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
      'C#5': 7, 'D#5': 8, 'F#5': 10, 'G#5': 11, 'A#5': 12,
      'C#6': 14, 'D#6': 15, 'F#6': 17, 'G#6': 18, 'A#6': 19,
    }

    const whiteKeyIndex = positionMap[noteName] || 0
    // Calculate the right edge of the white key and center the black key on it
    // Right edge = padding + (whiteKeyIndex + 1) * whiteKeyWidth + whiteKeyIndex * gap
    // Black key left position = right edge - half of black key width
    return keyboardPadding + (whiteKeyIndex + 1) * whiteKeyWidth + whiteKeyIndex * gap - (blackKeyWidth / 2)
  }

  return (
    <div className="keyboard-container">
      <div className="keyboard-header">
        <h2>Piano Keyboard</h2>
        <div className="duration-control">
          <label htmlFor="keyboard-duration">Duration:</label>
          <select
            id="keyboard-duration"
            value={currentDuration}
            onChange={(e) => onDurationChange(e.target.value as NoteDuration)}
            className="duration-select"
          >
            <option value="whole">Whole</option>
            <option value="half">Half</option>
            <option value="quarter">Quarter</option>
            <option value="eighth">Eighth</option>
            <option value="sixteenth">Sixteenth</option>
          </select>
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
