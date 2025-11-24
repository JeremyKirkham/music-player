import { useEffect, useState } from 'react'
import './LoadSongModal.css'
import type { MusicScore } from '../types/music'

interface LoadSongModalProps {
  isOpen: boolean
  onClose: () => void
  onLoadScore: (score: MusicScore) => void
}

interface SongOption {
  name: string
  file: string
}

const availableSongs: SongOption[] = [
  { name: 'Beams and Flags Test', file: 'beams-test.json' },
  { name: 'Twinkle Twinkle Little Star', file: 'twinkle-twinkle.json' },
  { name: 'C Major Scale', file: 'c-major-scale.json' },
  { name: 'Simple Chord Progression', file: 'simple-chord.json' },
]

const LoadSongModal = ({ isOpen, onClose, onLoadScore }: LoadSongModalProps) => {
  const [selectedSong, setSelectedSong] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Handle loading a song
  const handleLoadSong = async () => {
    if (!selectedSong) return

    setIsLoading(true)
    try {
      // Use import.meta.env.BASE_URL to get the correct base path
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}songs/${selectedSong}`)
      if (!response.ok) {
        throw new Error('Failed to load song')
      }
      const score: MusicScore = await response.json()
      onLoadScore(score)
      alert(`Loaded: ${availableSongs.find(s => s.file === selectedSong)?.name}`)
      onClose()
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
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content load-song-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Load Demo Song</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="modal-body">
          <div className="song-selector">
            <label htmlFor="song-select">Select a song:</label>
            <select
              id="song-select"
              value={selectedSong}
              onChange={(e) => setSelectedSong(e.target.value)}
              className="song-dropdown"
            >
              <option value="">-- Choose a song --</option>
              {availableSongs.map((song) => (
                <option key={song.file} value={song.file}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button
            onClick={handleLoadSong}
            className="btn-load"
            disabled={!selectedSong || isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Song'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoadSongModal
