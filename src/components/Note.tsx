import { useState, useRef, useEffect, useCallback } from 'react'
import type { Note as NoteType, NoteDuration } from '../types/music'
import { formatNoteToString, changePitchByPositions } from '../utils/musicUtilities'
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
  beamGroupId?: string
  onDragPitchChange?: (pitchOffset: number) => void
  onClick?: (element: HTMLElement) => void
}

const Note = ({ notes, duration, bottomPx, leftPosition, getNotePosition, isActive = false, beamGroupId, onDragPitchChange, onClick }: NoteProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef(0)
  const dragStartBottom = useRef(0)
  const dragStartTime = useRef(0)
  const dragMoved = useRef(false)
  const touchStartPos = useRef({ x: 0, y: 0 })
  const noteWrapperRef = useRef<HTMLDivElement>(null)

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

  // Constants for drag detection
  const DRAG_THRESHOLD = 5 // pixels
  const CLICK_TIME_THRESHOLD = 300 // milliseconds

  // Handle mouse down to start potential drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onDragPitchChange && !onClick) return
    
    e.preventDefault()
    e.stopPropagation()
    
    dragStartTime.current = Date.now()
    dragStartY.current = e.clientY
    dragStartBottom.current = bottomPx
    dragMoved.current = false
    
    if (onDragPitchChange) {
      setIsDragging(true)
    }
  }

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onDragPitchChange && !onClick) return
    
    e.stopPropagation()
    
    const touch = e.touches[0]
    dragStartTime.current = Date.now()
    dragStartY.current = touch.clientY
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    dragStartBottom.current = bottomPx
    dragMoved.current = false
    
    if (onDragPitchChange) {
      setIsDragging(true)
    }
  }

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaY = dragStartY.current - e.clientY
    
    // Check if movement exceeds threshold
    if (Math.abs(deltaY) > DRAG_THRESHOLD) {
      dragMoved.current = true
    }
    
    const targetBottom = dragStartBottom.current + deltaY
    
    // Snap to 10px intervals (each note position)
    // Note positions follow the pattern: ..., 2, 12, 22, 32, 42, 52, 62, 72, ...
    // Which is: 10n + 2 for integer n
    const POSITION_HEIGHT = 10
    const snappedBottom = Math.round((targetBottom - 2) / POSITION_HEIGHT) * POSITION_HEIGHT + 2
    
    setDragOffset(snappedBottom - dragStartBottom.current)
  }, [isDragging])

  // Handle touch move during drag
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    
    const touch = e.touches[0]
    const deltaY = dragStartY.current - touch.clientY
    
    // Check if movement exceeds threshold
    if (Math.abs(deltaY) > DRAG_THRESHOLD) {
      dragMoved.current = true
    }
    
    const targetBottom = dragStartBottom.current + deltaY
    
    // Snap to 10px intervals
    const POSITION_HEIGHT = 10
    const snappedBottom = Math.round((targetBottom - 2) / POSITION_HEIGHT) * POSITION_HEIGHT + 2
    
    setDragOffset(snappedBottom - dragStartBottom.current)
  }, [isDragging])

  // Handle mouse up to finish dragging or register click
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    
    const timeDelta = Date.now() - dragStartTime.current
    const wasQuickClick = timeDelta < CLICK_TIME_THRESHOLD && !dragMoved.current
    
    setIsDragging(false)
    
    if (wasQuickClick && onClick && noteWrapperRef.current) {
      // It was a click, not a drag
      onClick(noteWrapperRef.current)
    } else if (dragMoved.current) {
      // It was a drag
      const POSITION_HEIGHT = 10
      const positionChange = Math.round(dragOffset / POSITION_HEIGHT)
      
      if (positionChange !== 0 && onDragPitchChange) {
        onDragPitchChange(positionChange)
      }
    }
    
    setDragOffset(0)
    dragMoved.current = false
  }, [isDragging, dragOffset, onDragPitchChange, onClick])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    
    const timeDelta = Date.now() - dragStartTime.current
    const wasQuickClick = timeDelta < CLICK_TIME_THRESHOLD && !dragMoved.current
    
    setIsDragging(false)
    
    if (wasQuickClick && onClick && noteWrapperRef.current) {
      // It was a tap, not a drag
      onClick(noteWrapperRef.current)
    } else if (dragMoved.current) {
      // It was a drag
      const POSITION_HEIGHT = 10
      const positionChange = Math.round(dragOffset / POSITION_HEIGHT)
      
      if (positionChange !== 0 && onDragPitchChange) {
        onDragPitchChange(positionChange)
      }
    }
    
    setDragOffset(0)
    dragMoved.current = false
  }, [isDragging, dragOffset, onDragPitchChange, onClick])

  // Add/remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

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
      ref={noteWrapperRef}
      className={`note-wrapper ${getDurationClass(duration)} ${stemDown ? 'stem-down' : ''} ${isActive ? 'active' : ''} ${onDragPitchChange || onClick ? 'clickable' : ''} ${beamGroupId ? 'beamed' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ bottom: `${bottomPx + dragOffset}px`, left: `${leftPosition}px` }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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
        {isDragging ? (
          // Show preview of notes during drag
          notes.map(n => {
            const POSITION_HEIGHT = 10
            const positionChange = Math.round(dragOffset / POSITION_HEIGHT)
            const previewNote = positionChange !== 0 ? changePitchByPositions(n, positionChange) : n
            return formatNoteToString(previewNote)
          }).join('+')
        ) : (
          // Show actual notes when not dragging
          notes.map(n => formatNoteToString(n)).join('+')
        )}
      </span>
    </div>
  )
}

export default Note
