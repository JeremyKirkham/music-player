import { useState, useEffect, useRef, useCallback } from 'react'
import MusicalStaff from './components/MusicalStaff'
import Keyboard from './components/Keyboard'
import MusicModal from './components/MusicModal'
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
    createEmptyScore({ numerator: 4, denominator: 4 })
  )
  const [currentDuration, setCurrentDuration] = useState<NoteDuration>('quarter')
  const [currentClef, setCurrentClef] = useState<'treble' | 'bass'>('treble')
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
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
    const scheduledNotes = scheduleEvents(musicScore.events, musicScore.timeSignature.numerator)
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
  }, [musicScore.events, musicScore.timeSignature.numerator, stopPlayback])

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

  // Update time signature
  const updateTimeSignature = (timeSignature: TimeSignature) => {
    setMusicScore(prev => {
      // Recalculate score with new time signature
      let newScore = recalculateScoreForTimeSignature(prev, timeSignature)

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

      return newScore
    })
  }

  // Clear all notes
  const clearScore = () => {
    setMusicScore(currentScore => createEmptyScore(currentScore.timeSignature))
  }

  // Load a score from JSON
  const handleLoadScore = (score: MusicScore) => {
    // Stop playback if currently playing
    if (isPlaying) {
      stopPlayback()
    }
    setMusicScore(score)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Prevent default behavior (like navigating back)
        event.preventDefault()
        setMusicScore(currentScore => {
          if (currentScore.events.length > 0) {
            const lastEvent = currentScore.events[currentScore.events.length - 1]
            return removeEventFromScore(currentScore, lastEvent.id)
          }
          return currentScore
        })
      } else if (event.key === ' ') {
        // Spacebar to toggle play/stop
        event.preventDefault()
        togglePlayback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayback])

  // Handle note play from keyboard
  const handleNotePlay = (noteName: string) => {
    setMusicScore(currentScore => {
      const position = getCurrentPosition(currentScore, currentScore.timeSignature)
      const parsedNote = parseNoteString(noteName)

      const event: MusicalEvent = {
        id: generateId(),
        type: 'note',
        duration: currentDuration,
        notes: [
          {
            ...parsedNote,
            clef: currentClef,
          },
        ],
        position,
      }

      // Add the event to the score
      let newScore = addEventToScore(currentScore, event)

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

      return newScore
    })
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Music Player</h1>
        <div className="header-controls">
          <div className="duration-selector">
            <label htmlFor="duration">Duration: </label>
            <select
              id="duration"
              value={currentDuration}
              onChange={(e) => setCurrentDuration(e.target.value as NoteDuration)}
              className="duration-dropdown"
            >
              <option value="whole">Whole</option>
              <option value="half">Half</option>
              <option value="quarter">Quarter</option>
              <option value="eighth">Eighth</option>
              <option value="sixteenth">Sixteenth</option>
            </select>
          </div>
          <div className="clef-selector">
            <label htmlFor="clef">Clef: </label>
            <select
              id="clef"
              value={currentClef}
              onChange={(e) => setCurrentClef(e.target.value as 'treble' | 'bass')}
              className="clef-dropdown"
            >
              <option value="treble">Treble</option>
              <option value="bass">Bass</option>
            </select>
          </div>
          <div className="time-signature-selector">
            <label htmlFor="time-signature">Time Signature: </label>
            <select
              id="time-signature"
              value={`${musicScore.timeSignature.numerator}/${musicScore.timeSignature.denominator}`}
              onChange={(e) => {
                const [numerator, denominator] = e.target.value.split('/').map(Number)
                updateTimeSignature({ numerator, denominator })
              }}
              className="time-sig-dropdown"
            >
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
              <option value="6/8">6/8</option>
              <option value="5/4">5/4</option>
              <option value="7/8">7/8</option>
            </select>
          </div>
          <button onClick={clearScore} className="clear-btn">Clear Notes</button>
          <button onClick={stopPlayback} className="stop-btn" disabled={!isPlaying && !isPaused}>
            Stop
          </button>
          <button onClick={togglePlayback} className={isPlaying && !isPaused ? 'pause-btn' : 'play-btn'}>
            {isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => setIsMusicModalOpen(true)} className="debug-btn">
            View Score
          </button>
        </div>
      </div>
      <MusicalStaff
        musicScore={musicScore}
        activeEventIds={activeEventIds}
      />
      <Keyboard
        onNotePlay={handleNotePlay}
        activeNotes={activeNotes}
      />
      <MusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        musicScore={musicScore}
        onLoadScore={handleLoadScore}
      />
    </div>
  )
}

export default App
