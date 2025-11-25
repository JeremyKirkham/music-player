import { FaPlay, FaPause, FaStop } from 'react-icons/fa'
import { GiMetronome } from 'react-icons/gi'
import type { MusicScore } from '../types/music'
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

  return (
    <div className="playback-controls">
      <div className="playback-group">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={stopPlayback}
              variant="ghost"
              size="icon"
              className="playback-btn stop-btn"
              disabled={!isPlaying && !isPaused}
              aria-label="Stop"
            >
              <FaStop />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={togglePlayback}
              variant="ghost"
              size="icon"
              className={`playback-btn ${isPlaying && !isPaused ? 'pause-btn' : 'play-btn'}`}
              disabled={musicScore.events.length === 0 && !isPlaying && !isPaused}
              aria-label={isPaused ? 'Resume (spacebar)' : isPlaying ? 'Pause (spacebar)' : 'Play (spacebar)'}
            >
              {isPlaying && !isPaused ? <FaPause /> : <FaPlay />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPaused ? 'Resume (spacebar)' : isPlaying ? 'Pause (spacebar)' : 'Play (spacebar)'}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="playback-btn tempo-btn"
                  disabled={isPlaying || isPaused}
                  aria-label="Tempo"
                >
                  <GiMetronome />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tempo: {tempo} BPM</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            {tempoOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={tempo === option.value ? 'bg-accent' : ''}
                onClick={() => setTempo(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default PlaybackControls
