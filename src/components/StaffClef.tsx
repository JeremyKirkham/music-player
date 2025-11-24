import { useMemo } from 'react'
import './StaffClef.css'
import type { MusicScore, MusicalEvent, Note } from '../types/music'
import { calculateTotalDuration, formatNoteToString } from '../utils/musicUtilities'
import NoteComponent from './Note'

interface StaffClefProps {
  musicScore: MusicScore
  clefType: 'treble' | 'bass'
  activeEventIds?: Set<string>
  onNoteClick?: (event: MusicalEvent) => void
}

// Staff positioning constants (in pixels from bottom of measure)
const STAFF_POSITIONS = {
  TREBLE: {
    LINE_1: 72,   // E4 - bottom line
    LINE_2: 92,   // G4
    LINE_3: 112,  // B4 - middle line
    LINE_4: 132,  // D5
    LINE_5: 152,  // F5 - top line
  },
  BASS: {
    LINE_1: 72,   // G2 - bottom line
    LINE_2: 92,   // B2
    LINE_3: 112,  // D3 - middle line
    LINE_4: 132,  // F3
    LINE_5: 152,  // A3 - top line
  },
  POSITION_HEIGHT: 10,
  BASE_OFFSET: 72,
} as const

// Treble clef: C4 at 52px, E4 on bottom line at 72px, each note 10px apart
const TREBLE_NOTE_POSITION_MAP: { [key: string]: number } = {
  // Octave 2
  'A2': -38,
  'B2': -28,

  // Octave 3
  'C3': -18,
  'D3': -8,
  'E3': 2,
  'F3': 12,
  'G3': 22,
  'A3': 32,
  'B3': 42,

  // Octave 4 - E4 is on bottom line at 72
  'C4': 52,
  'D4': 62,
  'E4': 72,   // Bottom line
  'F4': 82,
  'G4': 92,   // Second line
  'A4': 102,
  'B4': 112,  // Middle line

  // Octave 5
  'C5': 122,
  'D5': 132,  // Fourth line
  'E5': 142,
  'F5': 152,  // Top line
  'G5': 162,
  'A5': 172,
  'B5': 182,

  // Octave 6
  'C6': 192,
  'D6': 202,
  'E6': 212,
  'F6': 222,
  'G6': 232,
  'A6': 242,
  'B6': 252,

  // Octave 7
  'C7': 262,
} as const

// Bass clef: G2 on bottom line (72px), each note 10px apart
const BASS_NOTE_POSITION_MAP: { [key: string]: number } = {
  // Octave 1
  'A1': 12,
  'B1': 22,

  // Octave 2 - G2 is on bottom line at 72
  'C2': 32,
  'D2': 42,
  'E2': 52,
  'F2': 62,
  'G2': 72,  // Bottom line
  'A2': 82,
  'B2': 92,  // Second line

  // Octave 3
  'C3': 102,
  'D3': 112,  // Middle line
  'E3': 122,
  'F3': 132,  // Fourth line
  'G3': 142,
  'A3': 152,  // Top line
  'B3': 162,

  // Octave 4
  'C4': 172,
  'D4': 182,
  'E4': 192,
  'F4': 202,
  'G4': 212,
  'A4': 222,
  'B4': 232,

  // Octave 5
  'C5': 242,
  'D5': 252,
  'E5': 262,
  'F5': 272,
  'G5': 282,
  'A5': 292,
  'B5': 302,

  // Octave 6
  'C6': 312,
} as const

const StaffClef = ({ musicScore, clefType, activeEventIds = new Set(), onNoteClick }: StaffClefProps) => {
  const PIXELS_PER_BEAT = 50

  // Get note position from the clef-specific map
  const getNotePosition = (note: Note): number => {
    const noteStr = formatNoteToString(note)
    const baseNoteName = noteStr.replace(/#|b/g, '')
    const positionMap = clefType === 'treble' ? TREBLE_NOTE_POSITION_MAP : BASS_NOTE_POSITION_MAP
    return positionMap[baseNoteName] || STAFF_POSITIONS.BASE_OFFSET
  }

  // Group ALL events into measures (for both clefs)
  const allMeasures = useMemo(() => {
    const measureMap = new Map<number, MusicalEvent[]>()

    // First, identify all measure indices from all events
    for (const event of musicScore.events) {
      const measureIndex = event.position.measureIndex
      if (!measureMap.has(measureIndex)) {
        measureMap.set(measureIndex, [])
      }
    }

    // Convert map to sorted array
    return Array.from(measureMap.keys()).sort((a, b) => a - b)
  }, [musicScore.events])

  // Filter events for this clef and group by measure
  const measures = useMemo(() => {
    const clefEvents = musicScore.events.filter(event => {
      if (event.type === 'rest') return true // Rests can appear in any clef
      return event.notes?.some(note => note.clef === clefType)
    })

    // Create a measure for each measure index, even if empty for this clef
    return allMeasures.map(measureIndex => {
      const eventsInMeasure = clefEvents
        .filter(event => event.position.measureIndex === measureIndex)
        .sort((a, b) => a.position.beatPosition - b.position.beatPosition)

      return {
        index: measureIndex,
        events: eventsInMeasure,
      }
    })
  }, [musicScore.events, clefType, allMeasures])

  const clefSymbol = clefType === 'treble' ? '𝄞' : '𝄢'

  return (
    <div className="staff-clef">
      {/* Clef symbol - fixed position */}
      <div className={`clef-symbol ${clefType}`}>{clefSymbol}</div>

      {/* Time signature */}
      <div className="time-signature-display">
        <div className="time-sig-top">{musicScore.timeSignature.numerator}</div>
        <div className="time-sig-bottom">{musicScore.timeSignature.denominator}</div>
      </div>

      {/* The 5 lines of the staff */}
      <div className="staff-lines">
        {[0, 1, 2, 3, 4].map((line) => (
          <div key={line} className="staff-line" />
        ))}
      </div>

      {/* Render measures and notes */}
      <div className="measures-container">
        {measures.map((measure) => {
          // Calculate width based on all events in this measure (both clefs)
          const allEventsInMeasure = musicScore.events.filter(
            e => e.position.measureIndex === measure.index
          )
          const measureWidth = Math.max(allEventsInMeasure.length * 50 + 40, 150)

          return (
          <div
            key={measure.index}
            className="measure"
            style={{ minWidth: `${measureWidth}px` }}
          >
            {measure.events.map((event) => {
              // Position notes based on their beat position within the measure
              const leftPosition = event.position.beatPosition * PIXELS_PER_BEAT + 10

              if (event.type === 'rest') {
                // Render rest
                return (
                  <div
                    key={event.id}
                    className="rest-wrapper"
                    style={{ bottom: '190px', left: `${leftPosition}px` }}
                  >
                    <span className="rest-symbol">𝄽</span>
                  </div>
                )
              }

              // Render note(s) - could be a chord
              const notes = event.notes || []
              if (notes.length === 0) return null

              // Get position of the primary note (first note)
              const bottomPx = getNotePosition(notes[0])

              return (
                <NoteComponent
                  key={event.id}
                  notes={notes}
                  duration={event.duration}
                  bottomPx={bottomPx}
                  leftPosition={leftPosition}
                  getNotePosition={getNotePosition}
                  isActive={activeEventIds.has(event.id)}
                  onClick={onNoteClick ? () => onNoteClick(event) : undefined}
                />
              )
            })}
            {/* Bar line at the end of each measure - only show if measure is complete */}
            {(() => {
              // Check if measure is complete based on ALL events (both clefs)
              const allEventsInMeasure = musicScore.events.filter(
                e => e.position.measureIndex === measure.index
              )
              const totalDuration = calculateTotalDuration(allEventsInMeasure)
              const expectedBeats = musicScore.timeSignature.numerator
              const isMeasureComplete = totalDuration >= expectedBeats

              return isMeasureComplete ? (
                <div className="bar-line" />
              ) : null
            })()}
          </div>
          )
        })}
      </div>
    </div>
  )
}

export default StaffClef
