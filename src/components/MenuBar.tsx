import { useState, useRef, useEffect } from 'react'
import { FaFolderOpen, FaFileAlt, FaTrash, FaEllipsisV } from 'react-icons/fa'
import type { MusicScore } from '../types/music'
import PlaybackControls from './PlaybackControls'

interface MenuBarProps {
  musicScore: MusicScore
  tempo: number
  setTempo: (tempo: number) => void
  isPlaying: boolean
  isPaused: boolean
  togglePlayback: () => void
  stopPlayback: () => void
  handleClearScore: () => void
  setIsLoadSongModalOpen: (isOpen: boolean) => void
  setIsMusicModalOpen: (isOpen: boolean) => void
}

function MenuBar({
  musicScore,
  tempo,
  setTempo,
  isPlaying,
  isPaused,
  togglePlayback,
  stopPlayback,
  handleClearScore,
  setIsLoadSongModalOpen,
  setIsMusicModalOpen,
}: MenuBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <div className="menu-bar">
      <div className="menu-left">
        <h1>Music Player</h1>
      </div>
      <div className="menu-center">
        <PlaybackControls
          musicScore={musicScore}
          isPlaying={isPlaying}
          isPaused={isPaused}
          togglePlayback={togglePlayback}
          stopPlayback={stopPlayback}
          tempo={tempo}
          setTempo={setTempo}
        />
        <button
          onClick={handleClearScore}
          className="clear-btn-round"
          title="Clear Score"
          disabled={musicScore.events.length === 0}
        >
          <FaTrash />
        </button>
      </div>
      <div className="menu-section menu-dropdown" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="menu-toggle-btn"
          title="Menu"
        >
          <FaEllipsisV />
        </button>
        {isMenuOpen && (
          <div className="dropdown-menu">
            <button
              onClick={() => {
                setIsLoadSongModalOpen(true)
                setIsMenuOpen(false)
              }}
              className="dropdown-item"
            >
              <FaFolderOpen /> Load Song
            </button>
            <button
              onClick={() => {
                setIsMusicModalOpen(true)
                setIsMenuOpen(false)
              }}
              className="dropdown-item"
            >
              <FaFileAlt /> View Score
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuBar
