import type { MusicScore, TimeSignature } from '../types/music'

interface MenuBarProps {
  musicScore: MusicScore
  tempo: number
  setTempo: (tempo: number) => void
  updateTimeSignature: (timeSignature: TimeSignature) => void
  isPlaying: boolean
  isPaused: boolean
  togglePlayback: () => void
  stopPlayback: () => void
  handleClearScore: () => void
  setIsLoadSongModalOpen: (isOpen: boolean) => void
  setIsMusicModalOpen: (isOpen: boolean) => void
}

function MenuBar({
  musicScore,
  tempo,
  setTempo,
  updateTimeSignature,
  isPlaying,
  isPaused,
  togglePlayback,
  stopPlayback,
  handleClearScore,
  setIsLoadSongModalOpen,
  setIsMusicModalOpen,
}: MenuBarProps) {
  return (
    <div className="menu-bar">
      <div className="menu-section">
        <div className="control-group">
          <label htmlFor="time-signature">Time Signature:</label>
          <select
            id="time-signature"
            value={`${musicScore.timeSignature.numerator}/${musicScore.timeSignature.denominator}`}
            onChange={(e) => {
              const [numerator, denominator] = e.target.value.split('/').map(Number)
              updateTimeSignature({ numerator, denominator })
            }}
            className="control-select"
            disabled={isPlaying || isPaused}
          >
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
            <option value="6/8">6/8</option>
            <option value="5/4">5/4</option>
            <option value="7/8">7/8</option>
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="tempo">Tempo (BPM):</label>
          <select
            id="tempo"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="control-select"
            disabled={isPlaying || isPaused}
          >
            <option value="40">40 - Grave</option>
            <option value="60">60 - Largo</option>
            <option value="80">80 - Andante</option>
            <option value="100">100 - Moderato</option>
            <option value="120">120 - Allegro</option>
            <option value="140">140 - Vivace</option>
            <option value="160">160 - Presto</option>
            <option value="180">180 - Prestissimo</option>
          </select>
        </div>
      </div>
      <div className="menu-section">
        <button onClick={togglePlayback} className={`control-btn ${isPlaying && !isPaused ? 'pause-btn' : 'play-btn'}`} disabled={musicScore.events.length === 0 && !isPlaying && !isPaused}>
          {isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={stopPlayback} className="control-btn stop-btn" disabled={!isPlaying && !isPaused}>
          Stop
        </button>
        <button onClick={handleClearScore} className="control-btn clear-btn">Clear</button>
        <button onClick={() => setIsLoadSongModalOpen(true)} className="control-btn load-btn">
          Load Song
        </button>
        <button onClick={() => setIsMusicModalOpen(true)} className="control-btn view-btn">
          View Score
        </button>
      </div>
    </div>
  )
}

export default MenuBar
