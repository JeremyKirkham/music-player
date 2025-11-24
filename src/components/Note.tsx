import type { Note as NoteType, NoteDuration } from '../types/music'
import { formatNoteToString } from '../utils/musicUtilities'
import { shouldBeBeamed, getBeamCount } from '../utils/beamCalculation'
import Flag from './Flag'
import './Note.css'

interface NoteProps {
  notes: NoteType[]
  duration: string
  bottomPx: number
  leftPosition: number
  getNotePosition: (note: NoteType) => number
  isActive?: boolean
  onClick?: () => void
  beamGroupId?: string
}

const Note = ({ notes, duration, bottomPx, leftPosition, getNotePosition, isActive = false, onClick, beamGroupId }: NoteProps) => {
  // Check if note is sharp/flat
  const isAccidental = (note: NoteType) =>
    note.accidental === 'sharp' || note.accidental === 'flat'

  // Check if the highest note is higher than B4
  const isHighNote = () => {
    const highestNote = notes.reduce((highest, note) => {
      const currentValue = note.octave * 12 + getNoteValue(note.pitch)
      const highestValue = highest.octave * 12 + getNoteValue(highest.pitch)
      return currentValue > highestValue ? note : highest
    })

    const b4Value = 4 * 12 + getNoteValue('B')
    const highestValue = highestNote.octave * 12 + getNoteValue(highestNote.pitch)
    return highestValue > b4Value
  }

  // Helper to convert pitch to numeric value
  const getNoteValue = (pitch: string): number => {
    const pitchMap: { [key: string]: number } = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    }
    return pitchMap[pitch] || 0
  }

  // Get the duration class for styling
  const getDurationClass = (duration: string) => {
    switch (duration) {
      case 'whole':
        return 'whole-note'
      case 'half':
      case 'dotted-half':
        return 'half-note'
      case 'quarter':
      case 'dotted-quarter':
        return 'quarter-note'
      case 'eighth':
      case 'dotted-eighth':
        return 'eighth-note'
      case 'sixteenth':
        return 'sixteenth-note'
      default:
        return 'quarter-note'
    }
  }

  // Check if note needs a stem (all except whole notes)
  const needsStem = (duration: string) => {
    return duration !== 'whole'
  }


  // Get the note head character based on duration
  const getNoteHead = (duration: string) => {
    switch (duration) {
      case 'whole':
      case 'half':
      case 'dotted-half':
        return '○' // Half note (hollow)
      case 'quarter':
      case 'dotted-quarter':
      case 'eighth':
      case 'dotted-eighth':
      case 'sixteenth':
      default:
        return '●' // Quarter/eighth/sixteenth (filled)
    }
  }

  const stemDown = isHighNote()
  const noteHead = getNoteHead(duration)

  // Determine if we should render a flag
  const renderFlag = () => {
    // Only render flag if:
    // 1. Note has a beamable duration (eighth, sixteenth, etc.)
    // 2. Note is NOT part of a beam group
    if (!shouldBeBeamed(duration as NoteDuration) || beamGroupId) {
      return null
    }

    const flagCount = getBeamCount(duration as NoteDuration)
    if (flagCount === 0) {
      return null
    }

    return (
      <Flag
        count={flagCount as 1 | 2}
        stemDirection={stemDown ? 'down' : 'up'}
      />
    )
  }

  return (
    <div
      className={`note-wrapper ${getDurationClass(duration)} ${stemDown ? 'stem-down' : ''} ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''} ${beamGroupId ? 'beamed' : ''}`}
      style={{ bottom: `${bottomPx}px`, left: `${leftPosition}px` }}
      onClick={onClick}
    >
      {/* Render all notes in the chord */}
      {notes.map((note, noteIndex) => {
        const noteBottomPx = getNotePosition(note)
        const offset = noteBottomPx - bottomPx
        const isLastNote = noteIndex === notes.length - 1

        return (
          <div
            key={noteIndex}
            className="note-group"
            style={{ bottom: `${offset}px` }}
          >
            {isAccidental(note) && !stemDown && (
              <span className="accidental">
                {note.accidental === 'sharp' ? '♯' : '♭'}
              </span>
            )}
            {isAccidental(note) && stemDown && (
              <span className="accidental accidental-left">
                {note.accidental === 'sharp' ? '♯' : '♭'}
              </span>
            )}
            <span className="note-head">{noteHead}</span>
            {/* Single stem attached to the last note */}
            {isLastNote && needsStem(duration) && (
              <span className="note-stem" />
            )}
          </div>
        )
      })}
      {/* Render flag if not in beam group */}
      {renderFlag()}
      {/* Show note name below for reference */}
      <span className="note-label-staff">
        {notes.map(n => formatNoteToString(n)).join('+')}
      </span>
    </div>
  )
}

export default Note
