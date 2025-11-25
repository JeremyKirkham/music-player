import { FaFolderOpen, FaFileAlt, FaTrash, FaEllipsisV } from 'react-icons/fa'
import type { MusicScore } from '../types/music'
import PlaybackControls from './PlaybackControls'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip'

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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClearScore}
              variant="ghost"
              size="icon"
              className="clear-btn-round"
              aria-label="Clear Score"
              disabled={musicScore.events.length === 0}
            >
              <FaTrash />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear Score</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="menu-section menu-dropdown">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="menu-toggle-btn"
              title="Menu"
            >
              <FaEllipsisV />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsLoadSongModalOpen(true)}>
              <FaFolderOpen className="mr-2" /> Load Song
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsMusicModalOpen(true)}>
              <FaFileAlt className="mr-2" /> View Score
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default MenuBar
