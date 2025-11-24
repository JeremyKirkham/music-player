import { useEffect, useState } from 'react'
import './NoteEditModal.css'
import type { MusicalEvent, Note, NoteDuration } from '../types/music'

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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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

  if (!isOpen || !event) return null

  return (
    <div className="note-edit-modal-overlay" onClick={onClose}>
      <div className="note-edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="note-edit-modal-header">
          <h2>Edit Note</h2>
          <button className="note-edit-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="note-edit-modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="pitch">Pitch (Tone)</label>
              <select
                id="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                className="form-select"
              >
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="octave">Octave</label>
              <input
                id="octave"
                type="number"
                min="0"
                max="8"
                value={octave}
                onChange={(e) => setOctave(parseInt(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="accidental">Accidental</label>
              <select
                id="accidental"
                value={accidental ?? ''}
                onChange={(e) => setAccidental(e.target.value === '' ? undefined : e.target.value as 'sharp' | 'flat' | 'natural')}
                className="form-select"
              >
                <option value="">None</option>
                <option value="sharp">♯ Sharp</option>
                <option value="flat">♭ Flat</option>
                <option value="natural">♮ Natural</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="clef">Clef</label>
              <select
                id="clef"
                value={clef}
                onChange={(e) => setClef(e.target.value as 'treble' | 'bass')}
                className="form-select"
              >
                <option value="treble">Treble</option>
                <option value="bass">Bass</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration</label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value as NoteDuration)}
                className="form-select"
              >
                <option value="whole">Whole</option>
                <option value="half">Half</option>
                <option value="dotted-half">Dotted Half</option>
                <option value="quarter">Quarter</option>
                <option value="dotted-quarter">Dotted Quarter</option>
                <option value="eighth">Eighth</option>
                <option value="dotted-eighth">Dotted Eighth</option>
                <option value="sixteenth">Sixteenth</option>
              </select>
            </div>

            <div className="form-group form-info">
              <label>Position</label>
              <div className="info-text">
                Measure {event?.position.measureIndex ?? 0}, Beat {event?.position.beatPosition ?? 0}
                <br />
                <span className="info-note">(Auto-calculated)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="note-edit-modal-footer">
          <button className="note-edit-delete-btn" onClick={handleDelete}>
            Delete Note
          </button>
          <div className="note-edit-footer-right">
            <button className="note-edit-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="note-edit-save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditModal
