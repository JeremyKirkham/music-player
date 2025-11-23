import type { Note as NoteType } from '../types/music'
import { formatNoteToString } from '../utils/musicUtilities'
import './Note.css'

interface NoteProps {
  notes: NoteType[]
  duration: string
  bottomPx: number
  leftPosition: number
  getNotePosition: (note: NoteType) => number
}

const Note = ({ notes, duration, bottomPx, leftPosition, getNotePosition }: NoteProps) => {
  // Check if note is sharp/flat
  const isAccidental = (note: NoteType) =>
    note.accidental === 'sharp' || note.accidental === 'flat'

  // Get the duration class for styling
  const getDurationClass = (duration: string) => {
    switch (duration) {
      case 'whole':
        return 'whole-note'
      case 'half':
        return 'half-note'
      case 'quarter':
        return 'quarter-note'
      case 'eighth':
        return 'eighth-note'
      case 'sixteenth':
        return 'sixteenth-note'
      default:
        return 'quarter-note'
    }
  }

  return (
    <div
      className={`note-wrapper ${getDurationClass(duration)}`}
      style={{ bottom: `${bottomPx}px`, left: `${leftPosition}px` }}
    >
      {/* Render all notes in the chord */}
      {notes.map((note, noteIndex) => {
        const noteBottomPx = getNotePosition(note)
        const offset = noteBottomPx - bottomPx

        return (
          <div
            key={noteIndex}
            className="note-group"
            style={{ bottom: `${offset}px` }}
          >
            {isAccidental(note) && (
              <span className="accidental">
                {note.accidental === 'sharp' ? '♯' : '♭'}
              </span>
            )}
            <span className="note-head">●</span>
          </div>
        )
      })}
      {/* Single stem for the chord */}
      <span className="note-stem" />
      {/* Show note name below for reference */}
      <span className="note-label-staff">
        {notes.map(n => formatNoteToString(n)).join('+')}
      </span>
    </div>
  )
}

export default Note
