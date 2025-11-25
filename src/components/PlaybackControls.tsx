import { useState, useRef, useEffect } from 'react'
import { FaPlay, FaPause, FaStop } from 'react-icons/fa'
import { GiMetronome } from 'react-icons/gi'
import type { MusicScore } from '../types/music'

interface PlaybackControlsProps {
  musicScore: MusicScore
  isPlaying: boolean
  isPaused: boolean
  togglePlayback: () => void
  stopPlayback: () => void
  tempo: number
  setTempo: (tempo: number) => void
}

function PlaybackControls({
  musicScore,
  isPlaying,
  isPaused,
  togglePlayback,
  stopPlayback,
  tempo,
  setTempo,
}: PlaybackControlsProps) {
  const [showTempoDropdown, setShowTempoDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tempoOptions = [
    { value: 40, label: '40 - Grave' },
    { value: 60, label: '60 - Largo' },
    { value: 80, label: '80 - Andante' },
    { value: 100, label: '100 - Moderato' },
    { value: 120, label: '120 - Allegro' },
    { value: 140, label: '140 - Vivace' },
    { value: 160, label: '160 - Presto' },
    { value: 180, label: '180 - Prestissimo' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTempoDropdown(false)
      }
    }

    if (showTempoDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTempoDropdown])

  const handleTempoSelect = (newTempo: number) => {
    setTempo(newTempo)
    setShowTempoDropdown(false)
  }

  return (
    <div className="playback-controls">
      <div className="playback-group">
        <button
          onClick={stopPlayback}
          className="playback-btn stop-btn"
          disabled={!isPlaying && !isPaused}
          data-tooltip="Stop"
          aria-label="Stop"
        >
          <FaStop />
        </button>
        <button
          onClick={togglePlayback}
          className={`playback-btn ${isPlaying && !isPaused ? 'pause-btn' : 'play-btn'}`}
          disabled={musicScore.events.length === 0 && !isPlaying && !isPaused}
          data-tooltip={isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
          aria-label={isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying && !isPaused ? <FaPause /> : <FaPlay />}
        </button>
        <div className="tempo-dropdown-container" ref={dropdownRef}>
          <button
            onClick={() => setShowTempoDropdown(!showTempoDropdown)}
            className="playback-btn tempo-btn"
            disabled={isPlaying || isPaused}
            data-tooltip={`Tempo: ${tempo} BPM`}
            aria-label="Tempo"
          >
            <GiMetronome />
          </button>
          {showTempoDropdown && (
            <div className="tempo-dropdown">
              {tempoOptions.map((option) => (
                <button
                  key={option.value}
                  className={`tempo-option ${tempo === option.value ? 'active' : ''}`}
                  onClick={() => handleTempoSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaybackControls
