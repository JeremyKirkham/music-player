import { useEffect, useRef } from 'react'
import './Keyboard.css'

interface Note {
  name: string
  frequency: number
  key: string
  isBlack?: boolean
}

interface KeyboardProps {
  onNotePlay: (note: string) => void
}

const Keyboard = ({ onNotePlay }: KeyboardProps) => {
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Note frequencies (C4 to C5)
  const notes: Note[] = [
    { name: 'C', frequency: 261.63, key: 'a' },
    { name: 'C#', frequency: 277.18, key: 'w', isBlack: true },
    { name: 'D', frequency: 293.66, key: 's' },
    { name: 'D#', frequency: 311.13, key: 'e', isBlack: true },
    { name: 'E', frequency: 329.63, key: 'd' },
    { name: 'F', frequency: 349.23, key: 'f' },
    { name: 'F#', frequency: 369.99, key: 't', isBlack: true },
    { name: 'G', frequency: 392.00, key: 'g' },
    { name: 'G#', frequency: 415.30, key: 'y', isBlack: true },
    { name: 'A', frequency: 440.00, key: 'h' },
    { name: 'A#', frequency: 466.16, key: 'u', isBlack: true },
    { name: 'B', frequency: 493.88, key: 'j' },
    { name: 'C5', frequency: 523.25, key: 'k' },
  ]

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

    onNotePlay(noteName)
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
  }, [])

  return (
    <div className="keyboard-container">
      <h2>Piano Keyboard</h2>
      <div className="keyboard">
        {notes.map(note => (
          <button
            key={note.name}
            data-key={note.key}
            className={`piano-key ${note.isBlack ? 'black' : 'white'}`}
            onClick={() => playNote(note.frequency, note.name)}
          >
            <span className="note-name">{note.name}</span>
            <span className="key-label">{note.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <p className="instruction">Click the keys or use your keyboard (A, W, S, E, D, F, T, G, Y, H, U, J, K)</p>
    </div>
  )
}

export default Keyboard
