import { useEffect } from 'react'
import './DebugModal.css'
import type { MusicScore } from '../types/music'

interface DebugModalProps {
  isOpen: boolean
  onClose: () => void
  musicScore: MusicScore
}

const DebugModal = ({ isOpen, onClose, musicScore }: DebugModalProps) => {
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
