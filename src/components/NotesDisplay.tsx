import './NotesDisplay.css'

interface PlayedNote {
  note: string
  id: number
}

interface NotesDisplayProps {
  notes: PlayedNote[]
}

const NotesDisplay = ({ notes }: NotesDisplayProps) => {
  return (
    <div className="notes-display">
      <h2>Notes Played</h2>
      <div className="notes-container">
        {notes.length === 0 ? (
          <p className="empty-message">Press keys to play notes...</p>
        ) : (
          notes.map(({ note, id }) => (
            <div key={id} className="note">
              {note}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotesDisplay
