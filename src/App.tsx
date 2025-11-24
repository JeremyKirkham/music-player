import { useState, useEffect, useRef, useCallback } from 'react'
import MusicalStaff from './components/MusicalStaff'
import Keyboard from './components/Keyboard'
import MusicModal from './components/MusicModal'
import NoteEditModal from './components/NoteEditModal'
import LoadSongModal from './components/LoadSongModal'
import MenuBar from './components/MenuBar'
import './App.css'
import type { MusicScore, NoteDuration, MusicalEvent, TimeSignature } from './types/music'
import {
  createEmptyScore,
  addEventToScore,
  removeEventFromScore,
  getCurrentPosition,
  generateId,
  parseNoteString,
  recalculateScoreForTimeSignature,
} from './utils/musicUtilities'
import { calculateScoreBeamGroups } from './utils/beamCalculation'
import {
  scheduleEvents,
  getNoteFrequency,
  playNoteSound,
} from './utils/playbackUtilities'
function App() {
  const [musicScore, setMusicScore] = useState<MusicScore>(() =>
    createEmptyScore({ numerator: 4, denominator: 4 }, 120)
  )
  const [history, setHistory] = useState<MusicScore[]>([
    createEmptyScore({ numerator: 4, denominator: 4 }, 120)
  ])
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const [currentDuration, setCurrentDuration] = useState<NoteDuration>('quarter')
  const [tempoState, setTempoState] = useState<number>(120) // BPM
  const tempo = tempoState

  // Custom setter that updates both tempo and score metadata
  const setTempo = useCallback((newTempo: number) => {
    setTempoState(newTempo)
    setMusicScore(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tempo: newTempo,
        modifiedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
  const [isLoadSongModalOpen, setIsLoadSongModalOpen] = useState(false)
  const [isNoteEditModalOpen, setIsNoteEditModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<MusicalEvent | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeEventIds, setActiveEventIds] = useState<Set<string>>(new Set())
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())

  const audioContextRef = useRef<AudioContext | null>(null)
  const scheduledTimeoutsRef = useRef<number[]>([])
  const pauseTimeRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const scheduledEventsRef = useRef<Array<{ event: MusicalEvent; startTime: number; duration: number }>>([])

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scheduledTimeoutsRef.current.forEach(clearTimeout)
      scheduledTimeoutsRef.current = []
    }
  }, [])

  // Play/Stop functionality
  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(false)
    setActiveEventIds(new Set())
    setActiveNotes(new Set())

    // Clear all scheduled timeouts
    scheduledTimeoutsRef.current.forEach(clearTimeout)
    scheduledTimeoutsRef.current = []

    // Reset tracking refs
    pauseTimeRef.current = 0
    startTimeRef.current = 0
    scheduledEventsRef.current = []
  }, [])

  const pausePlayback = useCallback(() => {
    if (!isPlaying || isPaused) return

    setIsPaused(true)
    pauseTimeRef.current = Date.now()

    // Clear all scheduled timeouts
    scheduledTimeoutsRef.current.forEach(clearTimeout)
    scheduledTimeoutsRef.current = []

    // Clear active highlights
    setActiveEventIds(new Set())
    setActiveNotes(new Set())
  }, [isPlaying, isPaused])

  const resumePlayback = useCallback(() => {
    if (!isPlaying || !isPaused) return

    setIsPaused(false)

    // Calculate elapsed time before pause
    const elapsedBeforePause = (pauseTimeRef.current - startTimeRef.current) / 1000
    const now = Date.now()
    startTimeRef.current = now - (elapsedBeforePause * 1000)

    // Reschedule remaining events
    scheduledEventsRef.current.forEach(({ event, startTime, duration }) => {
      const timeUntilStart = startTime - elapsedBeforePause

      // Only schedule events that haven't played yet
      if (timeUntilStart > 0) {
        if (event.type === 'note' && event.notes && audioContextRef.current) {
          const notes = event.notes

          const timeoutId = window.setTimeout(() => {
            // Highlight the event being played
            setActiveEventIds(prev => new Set([...prev, event.id]))

            // Highlight keyboard keys for the notes being played
            const noteStrings = notes.map(n => `${n.pitch}${n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : ''}${n.octave}`)

            // First remove the notes if they're already active (for consecutive identical notes)
            setActiveNotes(prev => {
              const newSet = new Set(prev)
              noteStrings.forEach(noteStr => newSet.delete(noteStr))
              return newSet
            })

            // Then add them back in the next tick to ensure re-render
            setTimeout(() => {
              setActiveNotes(prev => new Set([...prev, ...noteStrings]))
            }, 0)

            // Play sounds
            notes.forEach(note => {
              const frequency = getNoteFrequency(note)
              if (audioContextRef.current) {
                playNoteSound(audioContextRef.current, frequency, duration)
              }
            })

            // Clear active event and notes after duration
            const clearTimeoutId = window.setTimeout(() => {
              setActiveEventIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(event.id)
                return newSet
              })
              setActiveNotes(prev => {
                const newSet = new Set(prev)
                noteStrings.forEach(noteStr => newSet.delete(noteStr))
                return newSet
              })
            }, duration * 1000)
            scheduledTimeoutsRef.current.push(clearTimeoutId)
          }, timeUntilStart * 1000)

          scheduledTimeoutsRef.current.push(timeoutId)
        }
      }
    })

    // Reschedule auto-stop
    const totalDuration = scheduledEventsRef.current.length > 0
      ? scheduledEventsRef.current[scheduledEventsRef.current.length - 1].startTime +
        scheduledEventsRef.current[scheduledEventsRef.current.length - 1].duration
      : 0
    const remainingTime = totalDuration - elapsedBeforePause

    if (remainingTime > 0) {
      const stopTimeoutId = window.setTimeout(() => {
        stopPlayback()
      }, remainingTime * 1000)
      scheduledTimeoutsRef.current.push(stopTimeoutId)
    }
  }, [isPlaying, isPaused, stopPlayback])

  const startPlayback = useCallback(() => {
    if (musicScore.events.length === 0) return

    // Clear any existing timeouts
    scheduledTimeoutsRef.current.forEach(clearTimeout)
    scheduledTimeoutsRef.current = []

    setIsPlaying(true)
    setIsPaused(false)
    startTimeRef.current = Date.now()

    // Schedule all notes
    const scheduledNotes = scheduleEvents(musicScore.events, musicScore.timeSignature.numerator, tempo)
    scheduledEventsRef.current = scheduledNotes

    // Calculate total duration (end time of the last note)
    let totalDuration = 0
    if (scheduledNotes.length > 0) {
      const lastNote = scheduledNotes[scheduledNotes.length - 1]
      totalDuration = lastNote.startTime + lastNote.duration
    }

    // Play each note at its scheduled time
    scheduledNotes.forEach(({ event, startTime, duration }) => {
      if (event.type === 'note' && event.notes && audioContextRef.current) {
        const notes = event.notes

        const timeoutId = window.setTimeout(() => {
          // Highlight the event being played
          setActiveEventIds(prev => new Set([...prev, event.id]))

          // Highlight keyboard keys for the notes being played
          const noteStrings = notes.map(n => `${n.pitch}${n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : ''}${n.octave}`)

          // First remove the notes if they're already active (for consecutive identical notes)
          setActiveNotes(prev => {
            const newSet = new Set(prev)
            noteStrings.forEach(noteStr => newSet.delete(noteStr))
            return newSet
          })

          // Then add them back in the next tick to ensure re-render
          setTimeout(() => {
            setActiveNotes(prev => new Set([...prev, ...noteStrings]))
          }, 0)

          // Play sounds
          notes.forEach(note => {
            const frequency = getNoteFrequency(note)
            if (audioContextRef.current) {
              playNoteSound(audioContextRef.current, frequency, duration)
            }
          })

          // Clear active event and notes after duration
          const clearTimeoutId = window.setTimeout(() => {
            setActiveEventIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(event.id)
              return newSet
            })
            setActiveNotes(prev => {
              const newSet = new Set(prev)
              noteStrings.forEach(noteStr => newSet.delete(noteStr))
              return newSet
            })
          }, duration * 1000)
          scheduledTimeoutsRef.current.push(clearTimeoutId)
        }, startTime * 1000)

        scheduledTimeoutsRef.current.push(timeoutId)
      }
    })

    // Schedule automatic stop after all notes finish
    if (totalDuration > 0) {
      const stopTimeoutId = window.setTimeout(() => {
        stopPlayback()
      }, totalDuration * 1000)
      scheduledTimeoutsRef.current.push(stopTimeoutId)
    }
  }, [musicScore.events, musicScore.timeSignature.numerator, tempo, stopPlayback])

  const togglePlayback = useCallback(() => {
    if (isPaused) {
      // Resume if paused
      resumePlayback()
    } else if (isPlaying) {
      // Pause if playing
      pausePlayback()
    } else {
      // Start if stopped
      startPlayback()
    }
  }, [isPlaying, isPaused, startPlayback, pausePlayback, resumePlayback])

  // Helper to update score with history tracking
  const updateScoreWithHistory = useCallback((newScore: MusicScore) => {
    setMusicScore(newScore)
    // Truncate any future history if we're not at the end
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1)
      newHistory.push(newScore)
      return newHistory
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setMusicScore(history[newIndex])
      // Sync tempo from history
      if (history[newIndex].metadata.tempo) {
        setTempo(history[newIndex].metadata.tempo!)
      }
    }
  }, [historyIndex, history, setTempo])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setMusicScore(history[newIndex])
      // Sync tempo from history
      if (history[newIndex].metadata.tempo) {
        setTempo(history[newIndex].metadata.tempo!)
      }
    }
  }, [historyIndex, history, setTempo])

  // Update time signature
  const updateTimeSignature = (timeSignature: TimeSignature) => {
    // Recalculate score with new time signature
    let newScore = recalculateScoreForTimeSignature(musicScore, timeSignature)

    // Recalculate beam groups
    const { beamGroups, updatedEvents } = calculateScoreBeamGroups(
      newScore.events,
      newScore.timeSignature
    )

    newScore = {
      ...newScore,
      events: updatedEvents,
      beamGroups,
      measures: newScore.measures.map(measure => ({
        ...measure,
        beamGroups: beamGroups
          .filter(bg => {
            const firstEvent = updatedEvents.find(e => e.id === bg.eventIds[0])
            return firstEvent?.position.measureIndex === measure.index
          })
          .map(bg => bg.id),
      })),
    }

    updateScoreWithHistory(newScore)
  }

  // Clear all notes
  const clearScore = () => {
    const newScore = createEmptyScore(musicScore.timeSignature, tempo)
    updateScoreWithHistory(newScore)
  }

  // Handle clear with confirmation
  const handleClearScore = () => {
    if (confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      clearScore()
    }
  }

  // Load a score from JSON
  const handleLoadScore = (score: MusicScore) => {
    // Stop playback if currently playing
    if (isPlaying) {
      stopPlayback()
    }
    // Sync tempo from loaded score if it has one
    if (score.metadata.tempo) {
      setTempo(score.metadata.tempo)
    }
    updateScoreWithHistory(score)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((event.metaKey || event.ctrlKey) && (event.shiftKey && event.key === 'z' || event.key === 'y')) {
        event.preventDefault()
        redo()
        return
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Prevent default behavior (like navigating back)
        event.preventDefault()
        if (musicScore.events.length > 0) {
          const lastEvent = musicScore.events[musicScore.events.length - 1]
          const newScore = removeEventFromScore(musicScore, lastEvent.id)
          updateScoreWithHistory(newScore)
        }
      } else if (event.key === ' ') {
        // Spacebar to toggle play/stop
        event.preventDefault()
        togglePlayback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayback, musicScore, historyIndex, history, undo, redo, updateScoreWithHistory])

  // Handle note play from keyboard
  const handleNotePlay = (noteName: string) => {
    const position = getCurrentPosition(musicScore, musicScore.timeSignature)
    const parsedNote = parseNoteString(noteName)

    const event: MusicalEvent = {
      id: generateId(),
      type: 'note',
      duration: currentDuration,
      notes: [
        {
          ...parsedNote,
          clef: 'treble',
        },
      ],
      position,
    }

    // Add the event to the score
    let newScore = addEventToScore(musicScore, event)

    // Recalculate beam groups
    const { beamGroups, updatedEvents } = calculateScoreBeamGroups(
      newScore.events,
      newScore.timeSignature
    )

    newScore = {
      ...newScore,
      events: updatedEvents,
      beamGroups,
      measures: newScore.measures.map(measure => ({
        ...measure,
        beamGroups: beamGroups
          .filter(bg => {
            const firstEvent = updatedEvents.find(e => e.id === bg.eventIds[0])
            return firstEvent?.position.measureIndex === measure.index
          })
          .map(bg => bg.id),
      })),
    }

    updateScoreWithHistory(newScore)
  }

  // Handle note click to open edit modal
  const handleNoteClick = (event: MusicalEvent) => {
    setSelectedEvent(event)
    setIsNoteEditModalOpen(true)
  }

  // Handle saving updated note
  const handleSaveNote = (updatedEvent: MusicalEvent) => {
    // Find and replace the event with the updated one
    const updatedEvents = musicScore.events.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    )

    // Create a temporary score with updated events
    let tempScore: MusicScore = {
      ...musicScore,
      events: updatedEvents,
    }

    // Recalculate all positions and measures based on new durations
    tempScore = recalculateScoreForTimeSignature(tempScore, musicScore.timeSignature)

    // Recalculate beam groups
    const { beamGroups, updatedEvents: eventsWithBeams } = calculateScoreBeamGroups(
      tempScore.events,
      musicScore.timeSignature
    )

    // Update the score with beam groups
    const newScore: MusicScore = {
      ...tempScore,
      events: eventsWithBeams,
      beamGroups,
      measures: tempScore.measures.map(measure => ({
        ...measure,
        beamGroups: beamGroups
          .filter(bg => {
            const firstEvent = eventsWithBeams.find(e => e.id === bg.eventIds[0])
            return firstEvent?.position.measureIndex === measure.index
          })
          .map(bg => bg.id),
      })),
    }

    updateScoreWithHistory(newScore)
  }

  // Handle deleting a note
  const handleDeleteNote = (eventId: string) => {
    // Remove the event
    let newScore = removeEventFromScore(musicScore, eventId)

    // Recalculate all positions and measures for remaining events
    newScore = recalculateScoreForTimeSignature(newScore, musicScore.timeSignature)

    // Recalculate beam groups
    const { beamGroups, updatedEvents } = calculateScoreBeamGroups(
      newScore.events,
      musicScore.timeSignature
    )

    newScore = {
      ...newScore,
      events: updatedEvents,
      beamGroups,
      measures: newScore.measures.map(measure => ({
        ...measure,
        beamGroups: beamGroups
          .filter(bg => {
            const firstEvent = updatedEvents.find(e => e.id === bg.eventIds[0])
            return firstEvent?.position.measureIndex === measure.index
          })
          .map(bg => bg.id),
      })),
    }

    updateScoreWithHistory(newScore)
  }

  return (
    <div className="app">
      <div className="title-bar">
        <h1>Music Player</h1>
      </div>
      <MenuBar
        musicScore={musicScore}
        tempo={tempo}
        setTempo={setTempo}
        updateTimeSignature={updateTimeSignature}
        isPlaying={isPlaying}
        isPaused={isPaused}
        togglePlayback={togglePlayback}
        stopPlayback={stopPlayback}
        handleClearScore={handleClearScore}
        setIsLoadSongModalOpen={setIsLoadSongModalOpen}
        setIsMusicModalOpen={setIsMusicModalOpen}
      />
      <MusicalStaff
        musicScore={musicScore}
        activeEventIds={activeEventIds}
        onNoteClick={handleNoteClick}
      />
      <Keyboard
        onNotePlay={handleNotePlay}
        activeNotes={activeNotes}
        currentDuration={currentDuration}
        onDurationChange={setCurrentDuration}
      />
      <MusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        musicScore={musicScore}
      />
      <LoadSongModal
        isOpen={isLoadSongModalOpen}
        onClose={() => setIsLoadSongModalOpen(false)}
        onLoadScore={handleLoadScore}
      />
      <NoteEditModal
        key={selectedEvent?.id}
        isOpen={isNoteEditModalOpen}
        onClose={() => setIsNoteEditModalOpen(false)}
        event={selectedEvent}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  )
}

export default App
