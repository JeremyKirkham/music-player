import type { TimeSignature } from '../types/music'
import './TimeSignatureModal.css'

interface TimeSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  currentTimeSignature: TimeSignature
  onSelect: (timeSignature: TimeSignature) => void
}

function TimeSignatureModal({
  isOpen,
  onClose,
  currentTimeSignature,
  onSelect,
}: TimeSignatureModalProps) {
  if (!isOpen) return null

  const timeSignatures = [
    { numerator: 2, denominator: 4 },
    { numerator: 3, denominator: 4 },
    { numerator: 4, denominator: 4 },
    { numerator: 5, denominator: 4 },
    { numerator: 6, denominator: 8 },
    { numerator: 7, denominator: 8 },
  ]

  const handleSelect = (timeSignature: TimeSignature) => {
    onSelect(timeSignature)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="time-signature-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Select Time Signature</h2>
        <div className="time-signature-grid">
          {timeSignatures.map((ts) => (
            <button
              key={`${ts.numerator}/${ts.denominator}`}
              className={`time-signature-option ${
                currentTimeSignature.numerator === ts.numerator &&
                currentTimeSignature.denominator === ts.denominator
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleSelect(ts)}
            >
              <div className="time-sig-display">
                <div className="time-sig-num">{ts.numerator}</div>
                <div className="time-sig-denom">{ts.denominator}</div>
              </div>
            </button>
          ))}
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default TimeSignatureModal
