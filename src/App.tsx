import { useState, useEffect } from 'react'
import MusicalStaff from './components/MusicalStaff'
import Keyboard from './components/Keyboard'
import DebugModal from './components/DebugModal'
import './App.css'
import type { MusicScore, NoteDuration, MusicalEvent, TimeSignature } from './types/music'
import {
  createEmptyScore,
  addEventToScore,
  removeEventFromScore,
  getCurrentPosition,
  generateId,
  parseNoteString,
} from './utils/musicUtilities'
import { calculateScoreBeamGroups } from './utils/beamCalculation'

function App() {
  const [musicScore, setMusicScore] = useState<MusicScore>(() =>
    createEmptyScore({ numerator: 4, denominator: 4 })
  )
  const [currentDuration, setCurrentDuration] = useState<NoteDuration>('quarter')
  const [currentClef, setCurrentClef] = useState<'treble' | 'bass'>('treble')
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)

  // Update time signature
  const updateTimeSignature = (timeSignature: TimeSignature) => {
    setMusicScore(prev => ({ ...prev, timeSignature }))
  }

  // Clear all notes
  const clearScore = () => {
    setMusicScore(currentScore => createEmptyScore(currentScore.timeSignature))
  }

  // Handle backspace/delete key to remove last note
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
          <button onClick={() => setIsDebugModalOpen(true)} className="debug-btn">
            Debug JSON
          </button>
        </div>
      </div>
      <MusicalStaff musicScore={musicScore} />
      <Keyboard onNotePlay={handleNotePlay} />
      <DebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        musicScore={musicScore}
      />
    </div>
  )
}

export default App
