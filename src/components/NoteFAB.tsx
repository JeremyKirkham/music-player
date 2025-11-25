import type { NoteDuration } from '../types/music'
import './NoteFAB.css'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface NoteFABProps {
  onDelete: () => void
  onChangeDuration: (duration: NoteDuration) => void
  onChangeAccidental: (accidental: 'sharp' | 'flat' | 'natural' | undefined) => void
  onClose: () => void
  position: { x: number; y: number }
  currentDuration: string
  currentAccidental?: 'sharp' | 'flat' | 'natural'
}

const NoteFAB = ({ onDelete, onChangeDuration, onChangeAccidental, onClose, position, currentDuration, currentAccidental }: NoteFABProps) => {
  const durationOptions: { value: NoteDuration; label: string; symbol: string }[] = [
    { value: 'whole', label: 'Whole', symbol: '𝅝' },
    { value: 'half', label: 'Half', symbol: '𝅗𝅥' },
    { value: 'quarter', label: 'Quarter', symbol: '♩' },
    { value: 'eighth', label: 'Eighth', symbol: '♪' },
    { value: 'sixteenth', label: 'Sixteenth', symbol: '♬' },
  ]

  const accidentalOptions: { value: 'sharp' | 'flat' | 'natural' | undefined; label: string; symbol: string }[] = [
    { value: undefined, label: 'None', symbol: '♮̸' },
    { value: 'sharp', label: 'Sharp', symbol: '♯' },
    { value: 'flat', label: 'Flat', symbol: '♭' },
    { value: 'natural', label: 'Natural', symbol: '♮' },
  ]

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  const handleDurationSelect = (duration: NoteDuration) => {
    onChangeDuration(duration)
    onClose()
  }

  const handleAccidentalSelect = (accidental: 'sharp' | 'flat' | 'natural' | undefined) => {
    onChangeAccidental(accidental)
    onClose()
  }

  // Determine if note is on left or right half of screen
  const isOnLeftSide = position.x < window.innerWidth / 2

  // Arc configuration
  const radius = 65 // Distance from note center
  const buttonCount = 3
  const arcSpan = 80 // Total arc span in degrees for better spacing

  // Calculate button positions in an arc
  const getButtonPosition = (index: number) => {
    // For left side: arc goes bottom-right to stay in viewport
    // For right side: arc goes bottom-left to stay in viewport
    let baseAngle: number

    if (isOnLeftSide) {
      // Bottom-right arc: 280° to 360° in standard coords
      // This creates an arc that goes down and to the right
      baseAngle = 280 + (index * arcSpan / (buttonCount - 1))
    } else {
      // Bottom-left arc: 180° to 260° in standard coords
      // This creates an arc that goes down and to the left
      baseAngle = 180 + (index * arcSpan / (buttonCount - 1))
    }

    const angleRad = (baseAngle * Math.PI) / 180
    const x = Math.cos(angleRad) * radius
    // Negate Y because browser coords have Y increasing downward
    const y = -Math.sin(angleRad) * radius

    return { x, y }
  }

  const buttonPositions = [
    getButtonPosition(0), // Delete
    getButtonPosition(1), // Duration
    getButtonPosition(2), // Accidental
  ]

  return (
    <>
      {/* Backdrop to close FAB when clicking outside */}
      <div className="note-fab-backdrop" onClick={onClose} />

      <div
        className="note-fab-container"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="note-fab-button delete-button shadow-lg"
              onClick={(e) => handleButtonClick(e, onDelete)}
              aria-label="Delete note"
              style={{
                translate: `${buttonPositions[0].x}px ${buttonPositions[0].y}px`
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete note</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="note-fab-button duration-button shadow-lg"
                  aria-label="Change duration"
                  style={{
                    translate: `${buttonPositions[1].x}px ${buttonPositions[1].y}px`
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change duration</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="center" side="top" className="min-w-[180px] duration-dropdown">
            {durationOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={`duration-option ${currentDuration === option.value ? 'bg-accent' : ''}`}
                onClick={() => handleDurationSelect(option.value)}
              >
                <span className="text-2xl mr-3">{option.symbol}</span>
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="note-fab-button accidental-button shadow-lg"
                  aria-label="Change accidental"
                  style={{
                    translate: `${buttonPositions[2].x}px ${buttonPositions[2].y}px`
                  }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>♯♭</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change accidental</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="center" side="top" className="min-w-[160px]">
            {accidentalOptions.map((option) => (
              <DropdownMenuItem
                key={option.value ?? 'none'}
                className={currentAccidental === option.value ? 'bg-accent' : ''}
                onClick={() => handleAccidentalSelect(option.value)}
              >
                <span className="text-2xl mr-3">{option.symbol}</span>
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export default NoteFAB
