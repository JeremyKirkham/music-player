# Hold-Duration Note Recording Implementation Plan

## Overview
Implement a feature where note duration is automatically determined by how long a user holds down a keyboard key. Duration increments through predefined values at 250ms intervals, eliminating the need for manual duration selection.

## Duration Progression Timeline

| Hold Time | Duration | Beats |
|-----------|----------|-------|
| 0-49ms | Sixteenth | 0.25 |
| 50-99ms | Eighth | 0.5 |
| 100-299ms | Quarter | 1.0 |
| 300-599ms | Half | 2.0 |
| 600ms+ | Whole | 4.0 |

## Current System Analysis

### Existing Flow
1. User selects duration from dropdown before playing
2. User presses key → note plays immediately
3. Chord window (150ms) detects simultaneous notes
4. On keyup → commits note(s) to score with pre-selected duration

### What Changes
- **Remove:** Duration selector dropdown from Keyboard component
- **Add:** Real-time duration calculation based on key hold time
- **Modify:** Keydown handler to start duration timer
- **Modify:** Keyup handler to calculate final duration and commit note

## Implementation Steps

### 1. Add State Variables to Keyboard Component
**File:** `src/components/Keyboard.tsx`

```typescript
// After line 46, add new state variables:
const keyHoldTimersRef = useRef<Map<string, number>>(new Map())
const keyHoldStartTimesRef = useRef<Map<string, number>>(new Map())
const [keyHoldDurations, setKeyHoldDurations] = useState<Map<string, NoteDuration>>(new Map())

// Add constant for timing
const DURATION_INCREMENT_MS = 250
```

### 2. Create Duration Calculation Helper
**File:** `src/components/Keyboard.tsx`

Add before the component:

```typescript
const DURATION_SEQUENCE: NoteDuration[] = [
  'sixteenth',  // 0-249ms
  'eighth',     // 250-499ms
  'quarter',    // 500-749ms
  'half',       // 750-999ms
  'whole'       // 1000ms+
]

const getDurationFromHoldTime = (holdTimeMs: number): NoteDuration => {
  const index = Math.floor(holdTimeMs / DURATION_INCREMENT_MS)
  return DURATION_SEQUENCE[Math.min(index, DURATION_SEQUENCE.length - 1)]
}
```

### 3. Modify Pending Notes Type
**File:** `src/components/Keyboard.tsx` (line 44)

```typescript
// Change from:
const [_pendingNotes, setPendingNotes] = useState<Array<{
  name: string
  frequency: number
  clef: 'treble' | 'bass'
}>>([])

// To:
const [_pendingNotes, setPendingNotes] = useState<Array<{
  name: string
  frequency: number
  clef: 'treble' | 'bass'
  duration: NoteDuration
}>>([])
```

### 4. Update Component Props
**File:** `src/components/Keyboard.tsx` (line 19-26)

```typescript
// Remove from props interface:
currentDuration: NoteDuration
onDurationChange: (duration: NoteDuration) => void

// Change onNotePlay signature:
onNotePlay: (notes: string[], clef: 'treble' | 'bass', duration: NoteDuration) => void

// Updated interface:
interface KeyboardProps {
  onNotePlay: (notes: string[], clef: 'treble' | 'bass', duration: NoteDuration) => void
  activeNotes?: Set<string>
  showTrebleClef?: boolean
  showBassClef?: boolean
}
```

### 5. Remove Duration Selector from Keyboard Component
**File:** `src/components/Keyboard.tsx` (lines 384-400)

Delete the entire duration control section:

```typescript
// DELETE THIS BLOCK:
<div className="duration-control">
  <Select
    value={currentDuration}
    onValueChange={(value) => onDurationChange(value as NoteDuration)}
  >
    <SelectTrigger id="keyboard-duration" className="w-[130px] text-foreground">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="whole">Whole</SelectItem>
      <SelectItem value="half">Half</SelectItem>
      <SelectItem value="quarter">Quarter</SelectItem>
      <SelectItem value="eighth">Eighth</SelectItem>
      <SelectItem value="sixteenth">Sixteenth</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 6. Rewrite Keydown Handler
**File:** `src/components/Keyboard.tsx` (lines 282-304)

```typescript
const handleKeyPress = (event: KeyboardEvent) => {
  // Ignore keyboard shortcuts with modifier keys
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return
  }

  const key = event.key.toLowerCase()
  const note = notes.find(n => n.key === key)

  if (note && !event.repeat) {
    const now = Date.now()

    // Track when key was pressed
    keyHoldStartTimesRef.current.set(key, now)

    // Initialize duration at shortest value
    setKeyHoldDurations(prev => new Map(prev).set(key, 'sixteenth'))

    // Track pressed key
    setPressedKeys(prev => new Set([...prev, key]))

    // Play audio immediately
    playNote(note.frequency, note.name)

    // Start interval timer to update duration display
    const timerId = window.setInterval(() => {
      const startTime = keyHoldStartTimesRef.current.get(key)
      if (startTime) {
        const holdTime = Date.now() - startTime
        const newDuration = getDurationFromHoldTime(holdTime)
        setKeyHoldDurations(prev => new Map(prev).set(key, newDuration))
      }
    }, DURATION_INCREMENT_MS)

    keyHoldTimersRef.current.set(key, timerId)

    // Add visual feedback
    const button = document.querySelector(`[data-key="${key}"]`)
    if (button) {
      button.classList.add('active')
    }
  }
}
```

### 7. Rewrite Keyup Handler
**File:** `src/components/Keyboard.tsx` (lines 306-324)

```typescript
const handleKeyUp = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase()
  const note = notes.find(n => n.key === key)

  if (note) {
    // Calculate final held duration
    const startTime = keyHoldStartTimesRef.current.get(key)
    let finalDuration: NoteDuration = 'quarter' // default fallback

    if (startTime) {
      const holdTime = Date.now() - startTime
      finalDuration = getDurationFromHoldTime(holdTime)
    }

    // Add to pending notes buffer with calculated duration
    setPendingNotes(prev => {
      const newPending = [...prev, {
        name: note.name,
        frequency: note.frequency,
        clef: selectedClef,
        duration: finalDuration
      }]

      // Only start timer if this is the first note in the buffer
      if (prev.length === 0) {
        chordTimerRef.current = window.setTimeout(() => {
          commitPendingNotes()
        }, CHORD_WINDOW_MS)
      }

      return newPending
    })

    // Clean up timers and state for this key
    const timerId = keyHoldTimersRef.current.get(key)
    if (timerId) {
      clearInterval(timerId)
      keyHoldTimersRef.current.delete(key)
    }

    keyHoldStartTimesRef.current.delete(key)
    setKeyHoldDurations(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })

    // Remove visual feedback
    const button = document.querySelector(`[data-key="${key}"]`)
    if (button) {
      button.classList.remove('active')
    }
  }

  // Remove key from pressed keys
  setPressedKeys(prev => {
    const newSet = new Set(prev)
    newSet.delete(key)

    // If all keys are released, commit immediately
    if (newSet.size === 0) {
      setTimeout(() => {
        commitPendingNotes()
      }, 0)
    }

    return newSet
  })
}
```

### 8. Update commitPendingNotes for Chord Duration Handling
**File:** `src/components/Keyboard.tsx` (lines 91-115)

```typescript
// Import at top of file:
import { getDurationInBeats } from '../utils/playbackUtilities'

// Update function:
const commitPendingNotes = useCallback(() => {
  setPendingNotes(currentPending => {
    if (currentPending.length === 0) return currentPending

    // Extract note names from buffer
    const noteNames = currentPending.map(n => n.name)

    // All notes in a chord should use the same clef
    const clef = currentPending[0].clef

    // For chords, use the shortest duration (most conservative)
    // This ensures the chord ends when the first key is released
    const finalDuration = currentPending.reduce((shortest, current) => {
      return getDurationInBeats(current.duration) < getDurationInBeats(shortest.duration)
        ? current.duration
        : shortest.duration
    }, currentPending[0].duration)

    // Call parent handler with notes and calculated duration
    onNotePlayRef.current(noteNames, clef, finalDuration)

    // Clear the buffer
    return []
  })

  // Clear timer reference
  if (chordTimerRef.current !== null) {
    clearTimeout(chordTimerRef.current)
    chordTimerRef.current = null
  }
}, [])
```

### 9. Add Cleanup for Timers on Unmount
**File:** `src/components/Keyboard.tsx` (lines 78-88)

```typescript
// Update existing cleanup effect:
useEffect(() => {
  return () => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    // Clear chord timer on unmount
    if (chordTimerRef.current !== null) {
      clearTimeout(chordTimerRef.current)
    }
    // NEW: Clear all hold duration timers
    keyHoldTimersRef.current.forEach((timerId) => {
      clearInterval(timerId)
    })
    keyHoldTimersRef.current.clear()
  }
}, [])
```

### 10. Update App.tsx to Handle Duration Parameter
**File:** `src/App.tsx`

#### Remove currentDuration state (line 36):
```typescript
// DELETE THIS LINE:
const [currentDuration, setCurrentDuration] = useState<NoteDuration>('quarter')
```

#### Update handleNotePlay signature (line 439):
```typescript
// Change from:
const handleNotePlay = (noteNames: string[], clef: 'treble' | 'bass') => {

// To:
const handleNotePlay = (
  noteNames: string[],
  clef: 'treble' | 'bass',
  duration: NoteDuration
) => {
  const position = getCurrentPosition(musicScore, musicScore.timeSignature)

  const notes = noteNames.map(noteName => ({
    ...parseNoteString(noteName),
    clef: clef,
  }))

  const event: MusicalEvent = {
    id: generateId(),
    type: 'note',
    duration: duration, // Use passed duration instead of currentDuration
    notes: notes,
    position,
  }

  // ... rest of existing logic remains the same
}
```

#### Update Keyboard component usage (lines 684-691):
```typescript
// Change from:
<Keyboard
  onNotePlay={handleNotePlay}
  activeNotes={activeNotes}
  currentDuration={currentDuration}
  onDurationChange={setCurrentDuration}
  showTrebleClef={showTrebleClef}
  showBassClef={showBassClef}
/>

// To:
<Keyboard
  onNotePlay={handleNotePlay}
  activeNotes={activeNotes}
  showTrebleClef={showTrebleClef}
  showBassClef={showBassClef}
/>
```

## Visual Feedback (Optional Enhancement)

### Add Duration Indicator
Show current duration on the keyboard header as user holds keys:

```typescript
// In Keyboard.tsx, add to keyboard-header:
<div className="keyboard-header">
  <div className="keyboard-controls">
    <div className="clef-control">
      {/* existing clef selector */}
    </div>
    {keyHoldDurations.size > 0 && (
      <div className="duration-indicator">
        Hold Duration: {Array.from(keyHoldDurations.values())[0]}
      </div>
    )}
  </div>
</div>
```

### Add CSS for Duration Indicator
**File:** `src/components/Keyboard.css`

```css
.duration-indicator {
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border-radius: 4px;
  font-weight: 500;
  text-transform: capitalize;
}
```

## Edge Cases Handled

1. **Key repeat events** - Ignored via `!event.repeat` check
2. **Multiple keys held** - Each tracked independently, shortest duration used for chords
3. **Component unmount** - All timers cleared in cleanup effect
4. **Rapid press/release** - Minimum duration is sixteenth note (0-249ms)
5. **Very long holds** - Capped at whole note (1000ms+)
6. **Modifier keys** - Ignored to prevent conflicts with shortcuts

## Testing Checklist

- [ ] Single note press/release creates correct duration
- [ ] Holding key for 250ms creates eighth note
- [ ] Holding key for 500ms creates quarter note
- [ ] Holding key for 750ms creates half note
- [ ] Holding key for 1000ms+ creates whole note
- [ ] Chord (multiple simultaneous keys) uses shortest duration
- [ ] Rapid successive notes work correctly
- [ ] No memory leaks from timers
- [ ] Playback still works with recorded notes
- [ ] Undo/redo works correctly
- [ ] Beam grouping still functions

## Benefits of This Approach

1. **Intuitive** - Duration matches natural playing feel
2. **Faster workflow** - No manual duration selection needed
3. **Real-time feedback** - Visual indicator shows current duration
4. **Chord-aware** - Handles simultaneous notes intelligently
5. **Clean implementation** - Removes UI complexity (dropdown)

## Migration Notes

- Existing saved scores are unaffected (duration is stored per event)
- Users will need to learn new input method (no pre-selection)
- Duration selector removed entirely from UI
- All duration logic now in keyup handler

## Files Modified Summary

| File | Lines Changed | Type of Change |
|------|--------------|----------------|
| `src/components/Keyboard.tsx` | ~150 | Major refactor |
| `src/App.tsx` | ~10 | Signature updates |
| `src/components/Keyboard.css` | ~10 | Optional visual feedback |

## Implementation Time Estimate

- Core functionality: 2-3 hours
- Testing and debugging: 1-2 hours
- Visual feedback polish: 30 minutes
- **Total: 3-5 hours**
