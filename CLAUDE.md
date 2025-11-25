# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based music player application built with React, TypeScript, and Vite that allows users to create, edit, and play musical scores using standard music notation.

## Development Commands

### Development Server

```bash
npm run dev                    # Start dev server at http://localhost:5173
```

### Build & Preview

```bash
npm run build                  # Production build
npm run preview                # Preview production build
```

### Testing

```bash
# Unit tests (Vitest)
npm test                       # Watch mode
npm run test:run              # Run once
npm run test:ui               # UI mode

# E2E tests (Playwright)
npm run test:e2e              # Headless
npm run test:e2e:ui           # UI mode (recommended for development)
npm run test:e2e:headed       # See browser
npm run test:e2e:debug        # Debug mode
npm run playwright:report     # View test report
```

### Code Quality

```bash
npm run lint                  # Check for errors
npm run lint:fix              # Auto-fix errors
```

## Architecture

### State Management Pattern

The application uses a **history-based undo/redo system** centered around the `MusicScore` data structure. Every change to the score:

1. Creates a new immutable `MusicScore` object
2. Adds it to the history array via `updateScoreWithHistory()`
3. Updates the `historyIndex` pointer
4. Synchronizes related state (tempo) from the score metadata

**Key functions**:

- `updateScoreWithHistory()` - Updates score and tracks history (truncates future history if not at the end)
- `undo()` / `redo()` - Navigate history and restore score state
- Always sync tempo when loading/restoring scores: `setTempo(score.metadata.tempo!)`

### Core Data Flow

1. **User Input** → Keyboard component or MenuBar
2. **Event Creation** → Creates `MusicalEvent` with position calculated from current score state
3. **Score Mutation** → `addEventToScore()` or `removeEventFromScore()` returns new `MusicScore`
4. **Beam Recalculation** → `calculateScoreBeamGroups()` determines which notes connect with beams
5. **Measure Updates** → Measures are updated with event IDs and beam group IDs
6. **History Tracking** → `updateScoreWithHistory()` adds to undo/redo stack
7. **Render** → Components receive updated score and display it

### Time Signature Handling

When changing time signatures:

1. Call `recalculateScoreForTimeSignature()` to recompute all event positions and measures
2. Recalculate beam groups with `calculateScoreBeamGroups()`
3. Update measures with new beam group mappings

This ensures existing notes are properly redistributed across measures according to the new time signature.

### Playback System

Playback uses **scheduled timeouts** rather than real-time checking:

1. `scheduleEvents()` calculates start times for all events based on their positions and tempo
2. `startPlayback()` creates timeouts for each note using `window.setTimeout()`
3. Timeout IDs are stored in `scheduledTimeoutsRef` for cleanup
4. Audio is generated using the Web Audio API (`AudioContext`)
5. Visual highlighting (`activeEventIds`, `activeNotes`) is synchronized with playback
6. Pause/resume recalculates remaining event times from `pauseTimeRef` and `startTimeRef`

**Important**: Always clear `scheduledTimeoutsRef` before starting new playback or stopping.

### Beam Grouping Algorithm

Beams connect consecutive eighth notes and shorter within the same beat. The algorithm in `beamCalculation.ts`:

1. Checks if durations are beamable (`shouldBeBeamed()`)
2. Verifies notes are consecutive and on same clef
3. Ensures notes are within the same beat boundary
4. Groups them into `BeamGroup` objects with sequential `eventIds`
5. Updates events with `beamGroupId` references

When notes are added/removed/edited, beam groups must be fully recalculated for the entire score.

### Musical Position System

Positions use `{ measureIndex: number, beatPosition: number }`:

- `measureIndex`: which measure (0-indexed)
- `beatPosition`: fractional position within measure (e.g., 0.5 = halfway through first beat)

`getCurrentPosition()` calculates the next available position by:

1. Summing all event durations in beats
2. Computing which measure the total falls into
3. Calculating the beat offset within that measure

## Key Type Definitions

Located in `src/types/music.ts`:

- **`MusicScore`** - Complete composition with metadata, events, measures, and beam groups
- **`MusicalEvent`** - Single note/chord/rest with duration and position
- **`Note`** - Individual note with pitch, octave, accidental, and clef
- **`NoteDuration`** - Note length (whole, half, quarter, eighth, sixteenth, dotted variants)
- **`TimeSignature`** - Numerator/denominator (beats per measure / note value per beat)
- **`BeamGroup`** - Groups of connected beamed notes
- **`Measure`** - Container for events and beam groups with time signature

## Utility Modules

### `musicUtilities.ts`

- `parseNoteString()` / `formatNoteToString()` - Convert between "C#4" strings and Note objects
- `createEmptyScore()` - Initialize new score
- `addEventToScore()` / `removeEventFromScore()` - Immutable score updates
- `getCurrentPosition()` - Calculate next note position
- `recalculateScoreForTimeSignature()` - Recompute positions after time signature change

### `playbackUtilities.ts`

- `getDurationInSeconds()` / `getDurationInBeats()` - Convert durations using tempo
- `getNoteFrequency()` - Map Note objects to frequencies
- `playNoteSound()` - Generate audio using Web Audio API
- `scheduleEvents()` - Calculate timing for all events

### `beamCalculation.ts`

- `shouldBeBeamed()` - Check if duration qualifies for beaming
- `getBeamCount()` - How many beams needed (1 for eighth, 2 for sixteenth)
- `canBeamTogether()` - Validate if two events can be beamed
- `calculateScoreBeamGroups()` - Main algorithm to compute all beam groups

## Component Structure

- **App.tsx** - Main container with state management, playback logic, and keyboard shortcuts
- **MusicalStaff.tsx** - Renders staff notation with measures, clefs, notes
- **Keyboard.tsx** - Piano keyboard input with duration selector
- **MenuBar.tsx** - Tempo, time signature, playback controls
- **MusicModal.tsx** - Display/export score JSON
- **LoadSongModal.tsx** - Import score from JSON
- **NoteEditModal.tsx** - Edit or delete individual notes
- **Beam.tsx**, **Flag.tsx**, **Note.tsx** - Low-level SVG rendering components

## Testing Strategy

- **Unit tests** (`*.test.ts`): Focus on utility functions in `src/utils/`
- **E2E tests** (`e2e/*.spec.ts`): User flows using Playwright
- Vitest config excludes e2e directory
- Test files colocated with source files for unit tests

## Build Configuration

- **Vite**: Fast dev server and production bundler
- **Base path**: `/music-player/` - deployed to subdirectory
- **TypeScript**: Strict mode enabled with bundler module resolution
- **ESLint**: TypeScript, React, and React Hooks plugins

## Common Patterns

### Adding a Note

```typescript
const event: MusicalEvent = {
  id: generateId(),
  type: 'note',
  duration: currentDuration,
  notes: [parsedNote],
  position: getCurrentPosition(musicScore, timeSignature),
}
let newScore = addEventToScore(musicScore, event)
const { beamGroups, updatedEvents } = calculateScoreBeamGroups(newScore.events, timeSignature)
newScore = { ...newScore, events: updatedEvents, beamGroups, measures: [...] }
updateScoreWithHistory(newScore)
```

### Editing Duration

After changing an event's duration:

1. Update the event in the events array
2. Call `recalculateScoreForTimeSignature()` to recompute all positions
3. Call `calculateScoreBeamGroups()` to update beam groups
4. Update measures with new beam group mappings

### Keyboard Shortcuts

Implemented in App.tsx `useEffect` with `keydown` listener:

- Space: Play/Pause
- Backspace/Delete: Remove last note
- Cmd/Ctrl+Z: Undo
- Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: Redo
