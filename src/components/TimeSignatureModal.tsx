import type { TimeSignature } from '../types/music'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="time-signature-modal">
        <DialogHeader>
          <DialogTitle>Select Time Signature</DialogTitle>
        </DialogHeader>
        <div className="time-signature-grid grid grid-cols-3 gap-4">
          {timeSignatures.map((ts) => (
            <Button
              key={`${ts.numerator}/${ts.denominator}`}
              variant={
                currentTimeSignature.numerator === ts.numerator &&
                currentTimeSignature.denominator === ts.denominator
                  ? 'default'
                  : 'outline'
              }
              className="time-signature-option h-20 w-20 rounded-2xl"
              onClick={() => handleSelect(ts)}
            >
              <div className="time-sig-display flex flex-col">
                <div className="time-sig-num text-2xl font-bold">{ts.numerator}</div>
                <div className="time-sig-denom text-2xl font-bold">{ts.denominator}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TimeSignatureModal
