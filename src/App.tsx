import { useState } from 'react'
import NotesDisplay from './components/NotesDisplay'
import Keyboard from './components/Keyboard'
import './App.css'

interface PlayedNote {
  note: string
  id: number
}

function App() {
  const [playedNotes, setPlayedNotes] = useState<PlayedNote[]>([])

  const addNote = (note: string) => {
    setPlayedNotes(prev => [...prev, { note, id: Date.now() }])
  }

  const clearNotes = () => {
    setPlayedNotes([])
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Music Player</h1>
        <button onClick={clearNotes} className="clear-btn">Clear Notes</button>
      </div>
      <NotesDisplay notes={playedNotes} />
      <Keyboard onNotePlay={addNote} />
    </div>
  )
}

export default App
