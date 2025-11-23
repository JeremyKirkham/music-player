import { useMemo, useEffect, useRef } from 'react'
import './MusicalStaff.css'

interface PlayedNote {
  note: string
  id: number
}

interface MusicalStaffProps {
  notes: PlayedNote[]
  timeSignature: string
}

// Staff positioning constants (in pixels from bottom of measure)
// Staff lines positioned at top: 60px with height: 80px in measure
// Measure height: 200px
const STAFF_POSITIONS = {
  // Staff lines are at top: 60px from top of measure, height: 80px
  // Using CSS 'bottom' positioning - lower notes = smaller values
  // Lines are 20px apart (80px / 4 gaps)

  // Staff lines (from bottom to top)
  LINE_1: 140,  // E4 - bottom line (60px from top, 140px from bottom)
  LINE_2: 160,  // G4 (80px from top, 120px from bottom)
  LINE_3: 180,  // B4 - middle line (100px from top, 100px from bottom)
  LINE_4: 200,  // D5 (120px from top, 80px from bottom)
  LINE_5: 220,  // F5 - top line (140px from top, 60px from bottom)

  // Spacing between positions (line or space)
  POSITION_HEIGHT: 10,

  // Base offset
  BASE_OFFSET: 140,
} as const

// Comprehensive map of all notes to their vertical positions
// Position is in pixels from bottom of measure (200px total height)
// IMPORTANT: Using CSS 'bottom' - lower notes = SMALLER values, higher notes = LARGER values
const NOTE_POSITION_MAP: { [key: string]: number } = {
  // Octave 3 (ledger lines below staff)
  'A3': 100,
  'B3': 110,

  // Octave 4
  'C4': 120,  // ledger line below staff (lower than E4, so smaller value)
  'D4': 130,  // space below staff
  'E4': 140,  // LINE_1 (bottom line)
  'F4': 150,  // space
  'G4': 160,  // LINE_2
  'A4': 170,  // space
  'B4': 180,  // LINE_3 (middle line)

  // Octave 5
  'C5': 190,  // space
  'D5': 200,  // LINE_4
  'E5': 210,  // space
  'F5': 220,  // LINE_5 (top line)
  'G5': 230,  // space above staff
  'A5': 240,  // ledger line above staff
  'B5': 250,  // space above staff

  // Octave 6
  'C6': 260,  // ledger line above staff
  'D6': 270,
  'E6': 280,
  'F6': 290,
  'G6': 300,
  'A6': 310,
  'B6': 320,

  // Octave 7
  'C7': 330,
} as const

const MusicalStaff = ({ notes, timeSignature }: MusicalStaffProps) => {
  const staffContainerRef = useRef<HTMLDivElement>(null)
  // Parse time signature (e.g., "4/4" -> { beats: 4, noteValue: 4 })
  const parsedTimeSignature = useMemo(() => {
    const [beats, noteValue] = timeSignature.split('/').map(Number)
    return { beats, noteValue }
  }, [timeSignature])

  // Get note position from the comprehensive map
  // Sharp/flat notes use the same position as their natural counterparts
  const getNotePosition = (noteName: string): number => {
    // Remove sharp/flat symbols to get the base note position
    const baseNoteName = noteName.replace(/#|b/g, '')
    return NOTE_POSITION_MAP[baseNoteName] || STAFF_POSITIONS.BASE_OFFSET
  }

  // Group notes into measures based on time signature
  const measures = useMemo(() => {
    const result: PlayedNote[][] = []
    let currentMeasure: PlayedNote[] = []

    notes.forEach((note) => {
      if (currentMeasure.length >= parsedTimeSignature.beats) {
        result.push(currentMeasure)
        currentMeasure = []
      }
      currentMeasure.push(note)
    })

    if (currentMeasure.length > 0) {
      result.push(currentMeasure)
    }

    return result
  }, [notes, parsedTimeSignature.beats])

  // Auto-scroll to show latest notes
  useEffect(() => {
    if (staffContainerRef.current && notes.length > 0) {
      // Scroll to the right to show the latest notes
      staffContainerRef.current.scrollLeft = staffContainerRef.current.scrollWidth
    }
  }, [notes])

  // Check if note is sharp/flat
  const isAccidental = (noteName: string) => noteName.includes('#') || noteName.includes('b')

  return (
    <div className="musical-staff-container">
      <div className="time-signature-display">
        <div className="time-sig-top">{parsedTimeSignature.beats}</div>
        <div className="time-sig-bottom">{parsedTimeSignature.noteValue}</div>
      </div>

      {/* Treble clef - fixed position */}
      <div className="treble-clef">𝄞</div>

      <div className="staff-wrapper" ref={staffContainerRef}>
        {/* The 5 lines of the staff */}
        <div className="staff-lines">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="staff-line" />
          ))}
        </div>

        {/* Render measures and notes */}
        <div className="measures-container">
          {measures.map((measure, measureIndex) => (
            <div
              key={measureIndex}
              className="measure"
              style={{ minWidth: `${measure.length * 50 + 40}px` }}
            >
              {measure.map((playedNote, noteIndex) => {
                // Get the exact vertical position from the note position map
                const bottomPx = getNotePosition(playedNote.note)
                // Horizontal spacing within the measure
                const leftPosition = noteIndex * 50 + 10 // 50px spacing between notes, 10px from left

                return (
                  <div
                    key={playedNote.id}
                    className="note-wrapper"
                    style={{ bottom: `${bottomPx}px`, left: `${leftPosition}px` }}
                  >
                    {isAccidental(playedNote.note) && (
                      <span className="accidental">♯</span>
                    )}
                    <span className="note-head">●</span>
                    <span className="note-stem" />
                    {/* Show note name below for reference */}
                    <span className="note-label-staff">{playedNote.note}</span>
                  </div>
                )
              })}
              {/* Bar line after each measure except the last */}
              {measureIndex < measures.length - 1 && <div className="bar-line" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MusicalStaff
