# Flags and Beams Implementation Plan

## Overview
This document outlines the plan for implementing visual flags and beams for eighth notes (♪) and sixteenth notes (♬) in the music notation renderer, following standard music theory rules.

## Current State Analysis

### What's Already Implemented ✅
1. **Beam Calculation Logic** (`src/utils/beamCalculation.ts`)
   - `shouldBeBeamed()` - Identifies beamable note durations
   - `canBeamTogether()` - Validates if notes can beam together
   - `calculateBeamGroups()` - Groups notes that should be beamed
   - BeamGroup data structure with event IDs

2. **Data Structures** (`src/types/music.ts`)
   - `BeamGroup` interface with id, eventIds, type
   - `MusicalEvent.beamGroupId` field for group membership
   - Duration types: 'eighth', 'sixteenth', 'dotted-eighth'

3. **Note Rendering** (`src/components/Note.tsx`)
   - Stem rendering with direction logic (up/down based on pitch)
   - Note head positioning for chords
   - Stem height: 60px

4. **CSS Scaffolding** (`src/components/Note.css`)
   - `.flag` and `.note-flags` classes already defined
   - Stem direction positioning ready

### What's Missing ❌
1. Visual rendering of flag symbols on isolated notes
2. Visual rendering of beam connectors between grouped notes
3. Component to handle beam line positioning and angle calculation
4. Integration between Note component and beam group data

---

## Music Theory Rules for Beaming

### 1. Basic Beaming Rules
- **Eighth notes (♪)**: Single flag when alone, single beam when grouped
- **Sixteenth notes (♬)**: Double flag when alone, double beam when grouped
- **Dotted eighth notes**: Single flag when alone, single beam when grouped

### 2. When to Beam Notes Together
Notes should be beamed together when:
- They are consecutive within the same measure
- They are in the same clef (treble or bass)
- They fall within the same beat subdivision
- They are both notes (not rests, though rests can appear within beam groups)
- At least 2 notes meet the criteria

**Current Implementation**: Already handled by `canBeamTogether()` in beamCalculation.ts

### 3. When to Use Flags Instead
Use individual flags when:
- Only a single eighth or sixteenth note in a beat subdivision
- Note is isolated by rests
- Note crosses a measure boundary

### 4. Stem Direction Rules (Already Implemented)
- **Individual notes**: Stem up if below middle line (B4), stem down if on or above
- **Beamed groups**: Use the note furthest from the middle line to determine direction
  - Current implementation uses highest note to determine stem-down (above B4)
  - **Note**: May need refinement for groups with wide pitch ranges

### 5. Beam Positioning
- **Stem-up beams**: Connect at the top of all stems
- **Stem-down beams**: Connect at the bottom of all stems
- **Beam angle**: Should follow the general melodic contour
  - Slight upward slope for ascending passages
  - Slight downward slope for descending passages
  - Horizontal for notes of similar pitch
  - **Standard**: Keep angles subtle (typically max 30-45 degrees)

### 6. Multiple Beam Levels
- **Sixteenth notes**: Two parallel beam lines
- **Mixed groupings** (eighth + sixteenth):
  - Primary beam connects all notes
  - Secondary beam (partial beam) connects only sixteenth notes
  - Partial beams extend from the sixteenth note toward the next note

### 7. Beam Spacing
- Distance between beam lines: approximately 3-4 staff spaces (30-40px in our system)
- Beam thickness: 3-4px for clear visibility
- All beams in a group should be parallel

---

## Visual Design Specifications

### Flag Symbols
Two approaches to consider:

#### Option A: Unicode Characters
- **Eighth note flag**: `♪` (U+266A) or use the flag portion
- **Sixteenth note flag**: `♬` (U+266C) or stack two flags
- **Pros**: Simple implementation, lightweight
- **Cons**: Limited positioning control, may not align perfectly with stems

#### Option B: SVG Paths
- Draw flag shapes as SVG curves
- **Eighth flag**: Single curved flag extending from stem
- **Sixteenth flag**: Two stacked curved flags
- **Pros**: Perfect control over positioning, scaling, and appearance
- **Cons**: More complex implementation

**Recommendation**: Start with SVG for precise control and professional appearance

### Flag Positioning
- **Stem-up flags**: Attach to top-right of stem
- **Stem-down flags**: Attach to bottom-left of stem (mirror horizontally)
- Flags should curve away from the note head

### Beam Visual Design
- **Beam thickness**: 4px (similar to stem width of 2px, but slightly thicker for visibility)
- **Beam color**: Black (#000000), matching stem color
- **Beam spacing**: 8px between primary and secondary beams
- **Connection points**:
  - Stem-up: Top of each stem (60px from note head)
  - Stem-down: Bottom of each stem
- **Rendering**: SVG line or rect elements for clean, scalable appearance

### Beam Angle Calculation
For a group of beamed notes:
1. Find the leftmost and rightmost notes in the group
2. Calculate vertical positions based on their staff positions
3. Calculate slope: `(rightY - leftY) / (rightX - leftX)`
4. **Simplification**: For MVP, use horizontal beams (slope = 0)
5. **Enhancement**: Later add sloped beams with max angle constraint

---

## Implementation Approach

### Phase 1: Individual Flags (Isolated Notes)
**Goal**: Render flags on eighth and sixteenth notes that are NOT in beam groups

**Files to modify**:
- `src/components/Note.tsx`
- `src/components/Note.css`
- Create `src/components/Flag.tsx` (new)

**Logic**:
1. Check if note has beamable duration (eighth, sixteenth, dotted-eighth)
2. Check if note is NOT in a beam group (`!beamGroupId`)
3. Render appropriate flag based on duration:
   - Eighth: 1 flag
   - Sixteenth: 2 flags
   - Dotted-eighth: 1 flag with dot

**Component Structure**:
```typescript
interface FlagProps {
  count: 1 | 2;  // Number of flags
  stemDirection: 'up' | 'down';
}

const Flag: React.FC<FlagProps> = ({ count, stemDirection }) => {
  // Render SVG flag(s) with appropriate positioning
}
```

### Phase 2: Beam Connectors (Grouped Notes)
**Goal**: Render beam lines connecting notes in the same beam group

**Files to create/modify**:
- Create `src/components/Beam.tsx` (new)
- Modify `src/components/StaffClef.tsx` to render beams

**Data Flow**:
1. StaffClef receives `musicScore.beamGroups` array
2. For each BeamGroup, find all MusicalEvents with matching beamGroupId
3. Calculate positions of all notes in group
4. Render Beam component spanning all notes

**Component Structure**:
```typescript
interface BeamProps {
  events: MusicalEvent[];  // All events in this beam group
  beamCount: number;       // 1 for eighth, 2 for sixteenth
  stemDirection: 'up' | 'down';
  startX: number;          // Left position of first note
  endX: number;            // Right position of last note
  startY: number;          // Vertical position at first note
  endY: number;            // Vertical position at last note
}

const Beam: React.FC<BeamProps> = (props) => {
  // Render SVG beam line(s)
}
```

### Phase 3: Stem Direction Refinement for Groups
**Goal**: Improve stem direction logic for beamed groups

**Current Issue**: Individual note stem direction based only on highest note
**Desired Behavior**: For groups, consider all notes and choose direction that minimizes total stem length

**Algorithm**:
1. For beam group, collect all note pitches
2. Find average pitch position
3. If average is above middle line → stem down, else stem up
4. Alternative: Find note furthest from middle line and use that

### Phase 4: Mixed Beam Groups (Partial Beams)
**Goal**: Handle groups mixing eighth and sixteenth notes

**Complexity**: Some notes have 1 beam, some have 2
**Solution**:
- Primary beam connects all notes
- Secondary beam only connects sixteenth notes
- Partial beams extend from sixteenth toward neighbor (typically 1/3 to 1/2 note spacing)

**Implementation**:
- Beam component needs to handle array of beam counts per note
- Render primary beam for all
- Render secondary beams only where applicable

---

## Technical Implementation Steps

### Step 1: Create Flag Component
**File**: `src/components/Flag.tsx`

**Tasks**:
- [ ] Define SVG path data for eighth note flag (stem-up and stem-down)
- [ ] Define SVG path data for sixteenth note flag (2 flags)
- [ ] Create React component accepting count and direction props
- [ ] Add CSS for positioning relative to stem
- [ ] Test rendering on various notes

**SVG Specifications**:
- ViewBox: `0 0 20 60` (width 20px, height 60px to match stem)
- Flag curves: Use cubic Bezier paths for smooth curves
- Position flags at stem endpoint

### Step 2: Integrate Flags into Note Component
**File**: `src/components/Note.tsx`

**Tasks**:
- [ ] Add logic to determine if note should render flag
  - Check `shouldBeBeamed(duration)`
  - Check `!beamGroupId` (not in group)
- [ ] Import and render Flag component when appropriate
- [ ] Pass stem direction to Flag
- [ ] Pass flag count based on `getBeamCount(duration)`
- [ ] Ensure flags don't render when note is in beam group

**Code Addition**:
```typescript
import Flag from './Flag';
import { shouldBeBeamed, getBeamCount } from '../utils/beamCalculation';

// Inside Note component
const renderFlag = () => {
  if (!shouldBeBeamed(duration) || beamGroupId) {
    return null;
  }

  const flagCount = getBeamCount(duration);
  return <Flag count={flagCount} stemDirection={stemDirection} />;
};
```

### Step 3: Create Beam Component
**File**: `src/components/Beam.tsx`

**Tasks**:
- [ ] Define Beam interface and props
- [ ] Calculate beam start/end positions from note positions
- [ ] Render primary beam as SVG line or rect
- [ ] For double beams (sixteenth), render secondary beam below/above primary
- [ ] Handle stem-up vs stem-down positioning
- [ ] Apply CSS styling (color, thickness)

**Position Calculation**:
```typescript
// For each note in beam group:
const notePositionX = note.position.beatPosition * PIXELS_PER_BEAT + 10;
const notePositionY = getNotePosition(note.notes[0], clef);

// Beam endpoints:
const startX = Math.min(...notePositionsX);
const endX = Math.max(...notePositionsX);

// For horizontal beam (Phase 1):
const beamY = stemDirection === 'up'
  ? Math.max(...notePositionsY) + STEM_HEIGHT
  : Math.min(...notePositionsY) - STEM_HEIGHT;
```

**SVG Rendering**:
```tsx
<svg className="beam-connector" style={{ position: 'absolute' }}>
  <line
    x1={startX}
    y1={beamY}
    x2={endX}
    y2={beamY}
    stroke="black"
    strokeWidth="4"
  />
  {beamCount === 2 && (
    <line
      x1={startX}
      y1={beamY + spacing}
      x2={endX}
      y2={beamY + spacing}
      stroke="black"
      strokeWidth="4"
    />
  )}
</svg>
```

### Step 4: Integrate Beams into StaffClef
**File**: `src/components/StaffClef.tsx`

**Tasks**:
- [ ] Pass `musicScore.beamGroups` to component
- [ ] Filter beam groups for current measure and clef
- [ ] For each beam group, collect all events
- [ ] Calculate positions using existing positioning logic
- [ ] Render Beam component with calculated props
- [ ] Ensure beams render behind notes (z-index management)

**Data Collection**:
```typescript
// Group events by measure and clef
const beamGroupsInMeasure = musicScore.beamGroups.filter(group => {
  const firstEvent = musicScore.events.find(e => e.id === group.eventIds[0]);
  return firstEvent.position.measureIndex === measureIndex
    && firstEvent.notes[0].clef === clef;
});

// Render each beam group
{beamGroupsInMeasure.map(group => {
  const groupEvents = group.eventIds
    .map(id => musicScore.events.find(e => e.id === id))
    .filter(e => e !== undefined);

  return <Beam key={group.id} events={groupEvents} ... />;
})}
```

### Step 5: Update Note Component to Accept Beam Group ID
**File**: `src/components/Note.tsx`

**Tasks**:
- [ ] Add `beamGroupId?: string` to Note component props
- [ ] Pass beamGroupId from StaffClef when rendering notes
- [ ] Use beamGroupId in flag rendering decision
- [ ] Ensure stems still render for beamed notes

### Step 6: CSS Styling and Polish
**Files**: `src/components/Flag.css`, `src/components/Beam.css`

**Tasks**:
- [ ] Create CSS for flag positioning
- [ ] Create CSS for beam positioning and z-index
- [ ] Ensure beams appear connected to stems
- [ ] Test with various note combinations
- [ ] Adjust spacing, thickness, and colors as needed
- [ ] Handle hover and active states for playback

### Step 7: Testing Scenarios
Create test cases covering:
- [ ] Single eighth note (should show flag)
- [ ] Two consecutive eighth notes (should show beam)
- [ ] Single sixteenth note (should show 2 flags)
- [ ] Four sixteenth notes in a beat (should show double beam)
- [ ] Mix of eighth and sixteenth notes (partial beams)
- [ ] Dotted eighth notes
- [ ] Notes with stem-up direction
- [ ] Notes with stem-down direction
- [ ] Beamed groups crossing different pitches
- [ ] Chords with beams
- [ ] Both treble and bass clef

### Step 8: Enhancement - Sloped Beams (Future Phase)
**Tasks**:
- [ ] Calculate optimal beam angle based on note contour
- [ ] Limit maximum angle (e.g., 30 degrees)
- [ ] Adjust stem lengths to meet angled beam
- [ ] Ensure visual balance and readability

---

## Implementation Order (Recommended)

### MVP (Minimum Viable Product)
1. **Flag Component** (Step 1) - ~2 hours
2. **Integrate Flags** (Step 2) - ~1 hour
3. **Beam Component with Horizontal Beams** (Step 3) - ~3 hours
4. **Integrate Beams** (Step 4 & 5) - ~2 hours
5. **Basic Testing** (Step 7 subset) - ~1 hour

**Total MVP**: ~9 hours

### Polish
6. **CSS Refinement** (Step 6) - ~2 hours
7. **Comprehensive Testing** (Step 7 complete) - ~2 hours
8. **Bug Fixes and Edge Cases** - ~2 hours

**Total with Polish**: ~15 hours

### Future Enhancements
9. **Sloped Beams** (Step 8) - ~4 hours
10. **Partial Beams for Mixed Groups** (Step 4 Phase 4) - ~3 hours
11. **Advanced Stem Direction Logic** (Step 3 Phase 3) - ~2 hours

---

## Edge Cases to Consider

### 1. Rests Within Beam Groups
- **Scenario**: Eighth note, eighth rest, eighth note in same beat
- **Behavior**: First note gets flag, rest breaks beam, last note gets flag
- **Current Implementation**: `canBeamTogether` checks both are notes
- **Action**: Already handled ✅

### 2. Chords in Beam Groups
- **Scenario**: Multiple notes at same time position within beam group
- **Behavior**: Beam connects to the stem, which extends from primary note
- **Current Implementation**: Note component renders chords with shared stem
- **Action**: Beam should connect to chord stem position (use highest/lowest note)

### 3. Dotted Notes in Groups
- **Scenario**: Dotted eighth note potentially grouped with sixteenth
- **Behavior**: Dotted eighth behaves like eighth for beaming (single beam)
- **Current Implementation**: `shouldBeBeamed` returns true for dotted-eighth
- **Action**: Ensure dot renders correctly outside beam area

### 4. Cross-Staff Beaming
- **Scenario**: Notes in same measure but different clefs
- **Behavior**: Should NOT beam together
- **Current Implementation**: `canBeamTogether` checks same clef
- **Action**: Already handled ✅

### 5. First/Last Note of Measure
- **Scenario**: Eighth note at end of measure, followed by eighth note in next measure
- **Behavior**: Should NOT beam together (measure boundary)
- **Current Implementation**: `canBeamTogether` checks same measure
- **Action**: Already handled ✅

### 6. Very Wide Beam Groups
- **Scenario**: Many consecutive eighth notes spanning large horizontal distance
- **Behavior**: Beam may become very long
- **Action**: Consider visual break if group exceeds threshold (e.g., 8 notes)
  - **Optional Enhancement**: Could refine beaming rules to break at sub-beat boundaries

### 7. Extreme Pitch Ranges in Groups
- **Scenario**: Beamed group with notes spanning >2 octaves
- **Behavior**: Stems may be awkwardly long
- **Action**: Consider breaking into sub-groups or adjusting stem lengths
  - **Standard Practice**: Keep beam horizontal, extend stems as needed

---

## Validation Checklist

Before considering implementation complete:
- [ ] All eighth notes display either flag or beam
- [ ] All sixteenth notes display either double flag or double beam
- [ ] Flags face correct direction based on stem direction
- [ ] Beams connect stems at endpoints
- [ ] No beams crossing measure boundaries
- [ ] No beams crossing clef boundaries
- [ ] Beam thickness and spacing visually balanced
- [ ] Works with both treble and bass clef
- [ ] Works with chords
- [ ] Works with mixed note durations
- [ ] Playback highlighting still functions correctly
- [ ] Performance is acceptable (no lag during rendering)
- [ ] Responsive to window resize

---

## Open Questions for Discussion

1. **Flag Style**: Unicode characters or SVG paths?
   - **Recommendation**: SVG for control and appearance

2. **Beam Angle**: Start with horizontal only, or implement slopes immediately?
   - **Recommendation**: Horizontal for MVP, slopes as enhancement

3. **Partial Beams**: Include in MVP or defer to Phase 2?
   - **Recommendation**: Defer to enhancement phase

4. **Stem Length Adjustment**: Should stems extend/shorten to meet beams?
   - **Recommendation**: Keep fixed 60px for MVP, adjust if visual issues arise

5. **Visual Refinement**: Match specific notation software style (Sibelius, Finale, MuseScore)?
   - **Recommendation**: Follow MuseScore open-source standards

6. **Performance Optimization**: Pre-calculate beam positions vs. calculate on render?
   - **Recommendation**: Calculate on render for MVP, optimize if performance issues

---

## Success Metrics

Implementation will be considered successful when:
1. ✅ All eighth and sixteenth notes display appropriate flags or beams
2. ✅ Visual appearance follows standard music notation conventions
3. ✅ No errors or warnings in console
4. ✅ Existing functionality (playback, highlighting) still works
5. ✅ Code is well-documented and maintainable
6. ✅ No significant performance degradation

---

## References

- **Music Theory**: "Music Notation: A Manual of Modern Practice" by Gardner Read
- **Beaming Rules**: https://www.musictheory.net/lessons/13
- **SMuFL Standard** (Standard Music Font Layout): https://w3c.github.io/smufl/latest/
- **MuseScore Open Source**: https://github.com/musescore/MuseScore (reference implementation)

---

## Document Version
- **Version**: 1.0
- **Date**: 2025-11-24
- **Status**: Ready for Review

## Next Steps
1. Review this plan and provide feedback
2. Clarify any open questions
3. Approve approach and begin implementation
4. Start with MVP implementation (Steps 1-5)
