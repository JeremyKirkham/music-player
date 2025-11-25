import type { MusicScore } from '../types/music'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

interface MusicModalProps {
  isOpen: boolean
  onClose: () => void
  musicScore: MusicScore
}

const MusicModal = ({ isOpen, onClose, musicScore }: MusicModalProps) => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="debug-modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Music Score</DialogTitle>
          <DialogDescription>
            View and copy your music score data
          </DialogDescription>
        </DialogHeader>
        <div className="debug-modal-body">
          <div className="debug-stats grid grid-cols-2 gap-4 mb-4">
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
          <pre className="debug-json bg-muted p-4 rounded-md overflow-auto max-h-96">
            <code>{jsonString}</code>
          </pre>
        </div>
        <DialogFooter>
          <Button variant="redOutline" onClick={onClose}>
            Close
          </Button>
          <Button variant="green" onClick={copyToClipboard}>
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MusicModal
