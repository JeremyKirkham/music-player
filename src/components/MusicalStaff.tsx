import { useEffect, useRef } from 'react'
import './MusicalStaff.css'
import type { MusicScore, MusicalEvent } from '../types/music'
import StaffClef from './StaffClef'

interface MusicalStaffProps {
  musicScore: MusicScore
  activeEventIds?: Set<string>
  onNoteClick?: (event: MusicalEvent) => void
}

const MusicalStaff = ({ musicScore, activeEventIds = new Set(), onNoteClick }: MusicalStaffProps) => {
  const staffContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const PIXELS_PER_BEAT = 50
  const MEASURE_GAP = 40
  const STAFF_HEIGHT = 220 // Height of each StaffClef
  const TOTAL_STAFF_HEIGHT = STAFF_HEIGHT * 2 // Treble + Bass

  // Calculate and apply scale factor to fit available height
  useEffect(() => {
    if (!containerRef.current) return

    const updateScale = () => {
      if (!containerRef.current) return

      const containerHeight = containerRef.current.clientHeight
      const scale = Math.min(1, containerHeight / TOTAL_STAFF_HEIGHT)

      containerRef.current.style.setProperty('--staff-scale', scale.toString())
    }

    // Initial scale calculation
    updateScale()

    // Update scale on window resize
    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [TOTAL_STAFF_HEIGHT])

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

  // Auto-scroll to show latest notes
  useEffect(() => {
    if (staffContainerRef.current && musicScore.events.length > 0) {
      staffContainerRef.current.scrollLeft = staffContainerRef.current.scrollWidth
    }
  }, [musicScore.events.length])

  return (
    <div className="musical-staff-container" ref={containerRef}>
      {/* Fixed staff lines that don't scroll */}
      <div className="fixed-staff-lines-container">
        <div className="fixed-staff-clef">
          <div className="staff-lines">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={`treble-${line}`} className="staff-line" />
            ))}
          </div>
        </div>
        <div className="fixed-staff-clef">
          <div className="staff-lines">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={`bass-${line}`} className="staff-line" />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="staff-wrapper" ref={staffContainerRef}>
        <StaffClef
          musicScore={musicScore}
          clefType="treble"
          activeEventIds={activeEventIds}
          onNoteClick={onNoteClick}
        />
        <StaffClef
          musicScore={musicScore}
          clefType="bass"
          activeEventIds={activeEventIds}
          onNoteClick={onNoteClick}
        />
      </div>
    </div>
  )
}

export default MusicalStaff
