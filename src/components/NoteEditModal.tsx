import { useState } from 'react'
import './NoteEditModal.css'
import type { MusicalEvent, Note, NoteDuration } from '../types/music'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface NoteEditModalProps {
  isOpen: boolean
  onClose: () => void
  event: MusicalEvent | null
  onSave: (updatedEvent: MusicalEvent) => void
  onDelete: (eventId: string) => void
}

const NoteEditModal = ({ isOpen, onClose, event, onSave, onDelete }: NoteEditModalProps) => {
  // Initialize form values from event or use defaults
  // Note: Component remounts when event.id changes (via key prop in parent)
  const initialNote = event?.notes?.[0]
  const [pitch, setPitch] = useState<string>(initialNote?.pitch ?? 'C')
  const [octave, setOctave] = useState<number>(initialNote?.octave ?? 4)
  const [accidental, setAccidental] = useState<'sharp' | 'flat' | 'natural' | undefined>(initialNote?.accidental)
  const [duration, setDuration] = useState<NoteDuration>(event?.duration ?? 'quarter')
  const [clef, setClef] = useState<'treble' | 'bass'>(initialNote?.clef ?? 'treble')

  const handleSave = () => {
    if (!event) return

    const updatedNote: Note = {
      pitch,
      octave,
      clef,
      ...(accidental ? { accidental } : {})
    }

    const updatedEvent: MusicalEvent = {
      ...event,
      duration,
      notes: [updatedNote],
      // Position will be recalculated automatically
    }

    onSave(updatedEvent)
    onClose()
  }

  const handleDelete = () => {
    if (!event) return

    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(event.id)
      onClose()
    }
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="note-edit-modal-content max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Modify note properties or delete the note
          </DialogDescription>
        </DialogHeader>
        <div className="note-edit-modal-body">
          <div className="form-grid grid grid-cols-2 gap-4">
            <div className="form-group space-y-2">
              <label htmlFor="pitch">Pitch (Tone)</label>
              <Select
                value={pitch}
                onValueChange={setPitch}
              >
                <SelectTrigger id="pitch" className="form-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group space-y-2">
              <label htmlFor="octave">Octave</label>
              <Input
                id="octave"
                type="number"
                min="0"
                max="8"
                value={octave}
                onChange={(e) => setOctave(parseInt(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group space-y-2">
              <label htmlFor="accidental">Accidental</label>
              <Select
                value={accidental ?? ''}
                onValueChange={(value) => setAccidental(value === '' ? undefined : value as 'sharp' | 'flat' | 'natural')}
              >
                <SelectTrigger id="accidental" className="form-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="sharp">♯ Sharp</SelectItem>
                  <SelectItem value="flat">♭ Flat</SelectItem>
                  <SelectItem value="natural">♮ Natural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group space-y-2">
              <label htmlFor="clef">Clef</label>
              <Select
                value={clef}
                onValueChange={(value) => setClef(value as 'treble' | 'bass')}
              >
                <SelectTrigger id="clef" className="form-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="treble">Treble</SelectItem>
                  <SelectItem value="bass">Bass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group space-y-2 col-span-2">
              <label htmlFor="duration">Duration</label>
              <Select
                value={duration}
                onValueChange={(value) => setDuration(value as NoteDuration)}
              >
                <SelectTrigger id="duration" className="form-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whole">Whole</SelectItem>
                  <SelectItem value="half">Half</SelectItem>
                  <SelectItem value="dotted-half">Dotted Half</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="dotted-quarter">Dotted Quarter</SelectItem>
                  <SelectItem value="eighth">Eighth</SelectItem>
                  <SelectItem value="dotted-eighth">Dotted Eighth</SelectItem>
                  <SelectItem value="sixteenth">Sixteenth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group form-info col-span-2">
              <label>Position</label>
              <div className="info-text text-sm text-muted-foreground">
                Measure {event?.position.measureIndex ?? 0}, Beat {event?.position.beatPosition ?? 0}
                <br />
                <span className="info-note">(Auto-calculated)</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Delete Note
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NoteEditModal
