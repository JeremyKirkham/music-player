import { useMemo, useEffect, useRef } from 'react'
import './MusicalStaff.css'
import type { MusicScore, MusicalEvent, Note } from '../types/music'
import { calculateTotalDuration, formatNoteToString } from '../utils/musicUtilities'
import NoteComponent from './Note'

interface MusicalStaffProps {
  musicScore: MusicScore
  activeEventIds?: Set<string>
  onNoteClick?: (event: MusicalEvent) => void
}

// Staff positioning constants (in pixels from bottom of measure)
const STAFF_POSITIONS = {
  LINE_1: 140,  // E4 - bottom line
  LINE_2: 160,  // G4
  LINE_3: 180,  // B4 - middle line
  LINE_4: 200,  // D5
  LINE_5: 220,  // F5 - top line
  POSITION_HEIGHT: 10,
  BASE_OFFSET: 140,
} as const

// Comprehensive map of all notes to their vertical positions
const NOTE_POSITION_MAP: { [key: string]: number } = {
  // Octave 3
  'A3': 90,
  'B3': 100,

  // Octave 4
  'C4': 110,
  'D4': 120,
  'E4': 130,
  'F4': 140,
  'G4': 150,
  'A4': 160,
  'B4': 170,

  // Octave 5
  'C5': 180,
  'D5': 190,
  'E5': 200,
  'F5': 210,
  'G5': 220,
  'A5': 230,
  'B5': 240,

  // Octave 6
  'C6': 250,
  'D6': 260,
  'E6': 270,
  'F6': 280,
  'G6': 290,
  'A6': 300,
  'B6': 310,

  // Octave 7
  'C7': 320,
} as const

const MusicalStaff = ({ musicScore, activeEventIds = new Set(), onNoteClick }: MusicalStaffProps) => {
  const staffContainerRef = useRef<HTMLDivElement>(null)

  const PIXELS_PER_BEAT = 50
  const MEASURE_GAP = 40

  // Get note position from the comprehensive map
  const getNotePosition = (note: Note): number => {
    const noteStr = formatNoteToString(note)
    const baseNoteName = noteStr.replace(/#|b/g, '')
    return NOTE_POSITION_MAP[baseNoteName] || STAFF_POSITIONS.BASE_OFFSET
  }

  // Auto-scroll to keep active measure in view
  useEffect(() => {
    if (activeEventIds.size === 0 || !staffContainerRef.current) return

    // Find the first active event
    const activeEventId = Array.from(activeEventIds)[0]
    const activeEvent = musicScore.events.find(e => e.id === activeEventId)

    if (!activeEvent) return

    // Calculate the horizontal position of the active measure
    const measureWidth = 50 * musicScore.timeSignature.numerator + 40
    const measureIndex = activeEvent.position.measureIndex

    // Calculate the start and end position of the entire measure
    const measureStartX = (measureWidth + MEASURE_GAP) * measureIndex
    const measureEndX = measureStartX + measureWidth

    // Get the container's scroll position and dimensions
    const container = staffContainerRef.current
    const containerWidth = container.clientWidth
    const scrollLeft = container.scrollLeft

    // Check if the entire measure is visible
    const viewportStart = scrollLeft
    const viewportEnd = scrollLeft + containerWidth

    // If the measure is not fully visible, scroll to show it
    if (measureStartX < viewportStart) {
      // Measure is off the left edge, scroll to show the start of the measure
      container.scrollTo({ left: measureStartX, behavior: 'smooth' })
    } else if (measureEndX > viewportEnd) {
      // Measure is off the right edge, scroll to show the entire measure
      // Position the measure so it fits comfortably in the viewport
      const scrollTarget = Math.max(0, measureEndX - containerWidth + 20) // Add small padding
      container.scrollTo({ left: scrollTarget, behavior: 'smooth' })
    }
  }, [activeEventIds, musicScore.events, musicScore.timeSignature.numerator, PIXELS_PER_BEAT, MEASURE_GAP])

  // Group events into measures
  const measures = useMemo(() => {
    const measureMap = new Map<number, MusicalEvent[]>()

    for (const event of musicScore.events) {
      const measureIndex = event.position.measureIndex
      if (!measureMap.has(measureIndex)) {
        measureMap.set(measureIndex, [])
      }
      measureMap.get(measureIndex)!.push(event)
    }

    // Convert map to sorted array
    return Array.from(measureMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([index, events]) => ({
        index,
        events: events.sort((a, b) => a.position.beatPosition - b.position.beatPosition),
      }))
  }, [musicScore.events])

  // Auto-scroll to show latest notes
  useEffect(() => {
    if (staffContainerRef.current && musicScore.events.length > 0) {
      staffContainerRef.current.scrollLeft = staffContainerRef.current.scrollWidth
    }
  }, [musicScore.events.length])

  return (
    <div className="musical-staff-container">
      {/* Treble clef - fixed position */}
      <div className="treble-clef">𝄞</div>

      <div className="time-signature-display">
        <div className="time-sig-top">{musicScore.timeSignature.numerator}</div>
        <div className="time-sig-bottom">{musicScore.timeSignature.denominator}</div>
      </div>

      <div className="staff-wrapper" ref={staffContainerRef}>
        {/* The 5 lines of the staff */}
        <div className="staff-lines">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="staff-line" />
          ))}
        </div>

        {/* Render measures and notes */}
        <div className="measures-container">
          {measures.map((measure) => (
            <div
              key={measure.index}
              className="measure"
              style={{ minWidth: `${measure.events.length * 50 + 40}px` }}
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
                      style={{ bottom: '180px', left: `${leftPosition}px` }}
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
                const totalDuration = calculateTotalDuration(measure.events)
                const expectedBeats = musicScore.timeSignature.numerator
                const isMeasureComplete = totalDuration >= expectedBeats

                return isMeasureComplete ? (
                  <div className="bar-line" />
                ) : null
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MusicalStaff
