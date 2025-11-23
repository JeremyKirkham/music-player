import { useEffect, useState } from 'react'
import './DebugModal.css'
import type { MusicScore } from '../types/music'

interface DebugModalProps {
  isOpen: boolean
  onClose: () => void
  musicScore: MusicScore
  onLoadScore?: (score: MusicScore) => void
}

interface SongOption {
  name: string
  file: string
}

const availableSongs: SongOption[] = [
  { name: 'Twinkle Twinkle Little Star', file: 'twinkle-twinkle.json' },
  { name: 'C Major Scale', file: 'c-major-scale.json' },
  { name: 'Simple Chord Progression', file: 'simple-chord.json' },
]

const DebugModal = ({ isOpen, onClose, musicScore, onLoadScore }: DebugModalProps) => {
  const [selectedSong, setSelectedSong] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Handle loading a song
  const handleLoadSong = async () => {
    if (!selectedSong || !onLoadScore) return

    setIsLoading(true)
    try {
      const response = await fetch(`/songs/${selectedSong}`)
      if (!response.ok) {
        throw new Error('Failed to load song')
      }
      const score: MusicScore = await response.json()
      onLoadScore(score)
      alert(`Loaded: ${availableSongs.find(s => s.file === selectedSong)?.name}`)
    } catch (error) {
      console.error('Error loading song:', error)
      alert('Failed to load song. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const jsonString = JSON.stringify(musicScore, null, 2)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        alert('JSON copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy:', err)
      })
  }

  return (
    <div className="debug-modal-overlay" onClick={onClose}>
      <div className="debug-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="debug-modal-header">
          <h2>Music Score JSON Debug</h2>
          <button className="debug-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="debug-modal-body">
          {onLoadScore && (
            <div className="debug-song-selector">
              <label htmlFor="song-select">Load Demo Song: </label>
              <select
                id="song-select"
                value={selectedSong}
                onChange={(e) => setSelectedSong(e.target.value)}
                className="song-dropdown"
              >
                <option value="">-- Select a song --</option>
                {availableSongs.map((song) => (
                  <option key={song.file} value={song.file}>
                    {song.name}
                  </option>
                ))}
              </select>
              <button
                className="load-song-btn"
                onClick={handleLoadSong}
                disabled={!selectedSong || isLoading}
              >
                {isLoading ? 'Loading...' : 'Load'}
              </button>
            </div>
          )}
          <div className="debug-stats">
            <div className="debug-stat">
              <span className="debug-stat-label">Events:</span>
              <span className="debug-stat-value">{musicScore.events.length}</span>
            </div>
            <div className="debug-stat">
              <span className="debug-stat-label">Measures:</span>
              <span className="debug-stat-value">{musicScore.measures.length}</span>
            </div>
            <div className="debug-stat">
              <span className="debug-stat-label">Beam Groups:</span>
              <span className="debug-stat-value">{musicScore.beamGroups.length}</span>
            </div>
            <div className="debug-stat">
              <span className="debug-stat-label">Time Signature:</span>
              <span className="debug-stat-value">
                {musicScore.timeSignature.numerator}/{musicScore.timeSignature.denominator}
              </span>
            </div>
          </div>
          <pre className="debug-json">
            <code>{jsonString}</code>
          </pre>
        </div>
        <div className="debug-modal-footer">
          <button className="debug-copy-btn" onClick={copyToClipboard}>
            Copy to Clipboard
          </button>
          <button className="debug-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugModal
