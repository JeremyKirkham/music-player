import { useState } from 'react'
import type { MusicScore } from '../types/music'
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
import { Button } from './ui/button'

interface LoadSongModalProps {
  isOpen: boolean
  onClose: () => void
  onLoadScore: (score: MusicScore) => void
}

interface SongOption {
  name: string
  file: string
}

const availableSongs: SongOption[] = [
  { name: 'Twinkle Twinkle Little Star', file: 'twinkle-twinkle.json' },
  { name: 'C Major Scale', file: 'c-major-scale.json' },
  { name: 'Simple Chord Progression', file: 'simple-chord.json' },
]

const LoadSongModal = ({ isOpen, onClose, onLoadScore }: LoadSongModalProps) => {
  const [selectedSong, setSelectedSong] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Handle loading a song
  const handleLoadSong = async () => {
    if (!selectedSong) return

    setIsLoading(true)
    try {
      // Use import.meta.env.BASE_URL to get the correct base path
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}songs/${selectedSong}`)
      if (!response.ok) {
        throw new Error('Failed to load song')
      }
      const score: MusicScore = await response.json()
      onLoadScore(score)
      onClose()
    } catch (error) {
      console.error('Error loading song:', error)
      alert('Failed to load song. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-content load-song-modal">
        <DialogHeader>
          <DialogTitle>Load Demo Song</DialogTitle>
          <DialogDescription>
            Choose a demo song to load into the player
          </DialogDescription>
        </DialogHeader>
        <div className="modal-body">
          <div className="song-selector space-y-2">
            <label htmlFor="song-select">Select a song:</label>
            <Select
              value={selectedSong}
              onValueChange={setSelectedSong}
            >
              <SelectTrigger id="song-select" className="song-dropdown">
                <SelectValue placeholder="-- Choose a song --" />
              </SelectTrigger>
              <SelectContent>
                {availableSongs.map((song) => (
                  <SelectItem key={song.file} value={song.file}>
                    {song.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="redOutline">
            Cancel
          </Button>
          <Button
            onClick={handleLoadSong}
            disabled={!selectedSong || isLoading}
            variant="green"
          >
            {isLoading ? 'Loading...' : 'Load Song'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LoadSongModal
