import { useState } from 'react'
import type { NoteDuration } from '../types/music'
import './NoteFAB.css'

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
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showAccidentalDropdown, setShowAccidentalDropdown] = useState(false)

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

  const handleDurationSelect = (e: React.MouseEvent, duration: NoteDuration) => {
    e.stopPropagation()
    onChangeDuration(duration)
    onClose()
  }

  const toggleDurationDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDurationDropdown(!showDurationDropdown)
    setShowAccidentalDropdown(false)
  }

  const toggleAccidentalDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowAccidentalDropdown(!showAccidentalDropdown)
    setShowDurationDropdown(false)
  }

  const handleAccidentalSelect = (e: React.MouseEvent, accidental: 'sharp' | 'flat' | 'natural' | undefined) => {
    e.stopPropagation()
    onChangeAccidental(accidental)
    onClose()
  }

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
        <button
          className="note-fab-button delete-button"
          onClick={(e) => handleButtonClick(e, onDelete)}
          title="Delete note"
          aria-label="Delete note"
          data-tooltip="Delete note"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
        
        <div className="duration-fab-wrapper">
          <button
            className="note-fab-button duration-button"
            onClick={toggleDurationDropdown}
            title="Change duration"
            aria-label="Change duration"
            data-tooltip="Change duration"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>
        </div>
        
        <div className="accidental-fab-wrapper">
          <button
            className="note-fab-button accidental-button"
            onClick={toggleAccidentalDropdown}
            title="Change accidental"
            aria-label="Change accidental"
            data-tooltip="Change accidental"
          >
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>♯♭</span>
          </button>
        </div>
      </div>
      
      {/* Render dropdown outside backdrop to prevent click blocking */}
      {showDurationDropdown && (
        <div 
          className="duration-dropdown" 
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y - 60}px`,
            transform: 'translateX(-50%)',
            zIndex: 1001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {durationOptions.map((option) => (
            <button
              key={option.value}
              className={`duration-option ${currentDuration === option.value ? 'active' : ''}`}
              onClick={(e) => handleDurationSelect(e, option.value)}
            >
              <span className="duration-symbol">{option.symbol}</span>
              <span className="duration-label">{option.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Accidental dropdown */}
      {showAccidentalDropdown && (
        <div 
          className="accidental-dropdown" 
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y - 60}px`,
            transform: 'translateX(-50%)',
            zIndex: 1001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {accidentalOptions.map((option) => (
            <button
              key={option.value ?? 'none'}
              className={`accidental-option ${currentAccidental === option.value ? 'active' : ''}`}
              onClick={(e) => handleAccidentalSelect(e, option.value)}
            >
              <span className="accidental-symbol">{option.symbol}</span>
              <span className="accidental-label">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default NoteFAB
