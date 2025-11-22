import { useState } from 'react'
import MusicalStaff from './components/MusicalStaff'
import Keyboard from './components/Keyboard'
import './App.css'

interface PlayedNote {
  note: string
  id: number
}

function App() {
  const [playedNotes, setPlayedNotes] = useState<PlayedNote[]>([])
  const [timeSignature, setTimeSignature] = useState('4/4')

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
        <div className="header-controls">
          <div className="time-signature-selector">
            <label htmlFor="time-signature">Time Signature: </label>
            <select
              id="time-signature"
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="time-sig-dropdown"
            >
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
              <option value="6/8">6/8</option>
              <option value="5/4">5/4</option>
              <option value="7/8">7/8</option>
            </select>
          </div>
          <button onClick={clearNotes} className="clear-btn">Clear Notes</button>
        </div>
      </div>
      <MusicalStaff notes={playedNotes} timeSignature={timeSignature} />
      <Keyboard onNotePlay={addNote} />
    </div>
  )
}

export default App
