import { useMemo } from 'react'
import './MusicalStaff.css'

interface PlayedNote {
  note: string
  id: number
}

interface MusicalStaffProps {
  notes: PlayedNote[]
  timeSignature: string
}

const MusicalStaff = ({ notes, timeSignature }: MusicalStaffProps) => {
  // Parse time signature (e.g., "4/4" -> { beats: 4, noteValue: 4 })
  const parsedTimeSignature = useMemo(() => {
    const [beats, noteValue] = timeSignature.split('/').map(Number)
    return { beats, noteValue }
  }, [timeSignature])

  // Map note names to their vertical position on the staff
  // Using treble clef: E4 is on the first line, going up to C7
  const getNotePosition = (noteName: string): number => {
    // Remove octave number and get base note (remove sharps/flats too)
    const baseNote = noteName.replace(/[0-9#b]/g, '')
    const octave = parseInt(noteName.match(/\d+/)?.[0] || '4')

    // Map each note letter to its position in the musical scale (C=0, D=1, E=2, etc.)
    const noteScalePositions: { [key: string]: number } = {
      'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
    }

    // Get the base note value
    const noteValue = noteScalePositions[baseNote] || 0

    // Calculate absolute position (each octave has 7 notes: C, D, E, F, G, A, B)
    const absolutePosition = noteValue + (octave * 7)

    // E4 is the reference point (bottom line of treble clef) = position 0
    // E4 = 2 + (4 * 7) = 30
    const e4Position = 2 + (4 * 7)

    // Return position relative to E4 (bottom line)
    return absolutePosition - e4Position
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

  // Check if note is sharp/flat
  const isAccidental = (noteName: string) => noteName.includes('#') || noteName.includes('b')

  return (
    <div className="musical-staff-container">
      <div className="time-signature-display">
        <div className="time-sig-top">{parsedTimeSignature.beats}</div>
        <div className="time-sig-bottom">{parsedTimeSignature.noteValue}</div>
      </div>

      <div className="staff-wrapper">
        {/* The 5 lines of the staff */}
        <div className="staff-lines">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="staff-line" />
          ))}
        </div>

        {/* Treble clef */}
        <div className="treble-clef">𝄞</div>

        {/* Render measures and notes */}
        <div className="measures-container">
          {measures.map((measure, measureIndex) => (
            <div
              key={measureIndex}
              className="measure"
              style={{ minWidth: `${measure.length * 50 + 40}px` }}
            >
              {measure.map((playedNote, noteIndex) => {
                const position = getNotePosition(playedNote.note)
                // Each position (line or space) is 10px apart
                // E4 (position 0) is on the bottom line at 20px
                // Staff lines are at: 20px (E4), 40px (G4), 60px (B4), 80px (D5), 100px (F5)
                // C4 (position -2) = 0px (below staff), D4 (position -1) = 10px
                const bottomPx = position * 10 + 20
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
