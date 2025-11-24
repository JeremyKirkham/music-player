# Sheet Music OCR Feature Plan

**Last Updated:** November 24, 2025  
**Status:** Planning Phase  
**Approach:** Client-Side Processing (No Backend Required)

---

## Overview

Add the ability for users to upload a screenshot or image of sheet music and automatically convert it to a playable score using client-side Optical Music Recognition (OMR).

## 1. UI/UX Components

### Main Entry Point
- Add "Import from Screenshot" button in the Load Song modal (alongside existing song list)

### SheetMusicUploadModal Component
- **Drag-and-drop zone** for image upload
- **File picker** supporting PNG, JPG formats
- **Image preview** with zoom/pan controls
- **Progress indicator** during OCR processing
- **Results preview** showing detected notes in simplified staff view
- **Edit/correction interface** with click-to-fix functionality
- **Import** and **Cancel** buttons

---

## 2. Client-Side OCR Strategy

### Two-Phase Approach

#### Phase 1 (MVP): Rule-Based Computer Vision
- Use **OpenCV.js** or **Jimp** for traditional computer vision
- Detect staff lines using horizontal line detection (Hough transform)
- Identify note heads (circles/ovals) using contour detection
- Determine stems and flags for duration
- **Pros:** Predictable, debuggable, works for clean printed music
- **Cons:** Limited to simple, well-printed scores

#### Phase 2 (Enhanced): Pre-trained ML Model
- Integrate **TensorFlow.js** with a pre-trained OMR model
- Options:
  - Audiveris-trained model (if available for TFJS)
  - Custom model trained on synthetic sheet music
  - YOLO-based object detection for musical symbols
- Train on publicly available datasets: **DeepScores**, **MUSCIMA++**, or **PrIMuS**
- **Pros:** Better accuracy, handles handwritten music
- **Cons:** Larger bundle size (~5-10MB), slower initial load

**Recommendation:** Start with Phase 1, add Phase 2 incrementally

---

## 3. Computer Vision Pipeline (Phase 1)

```
Image Upload → Canvas Rendering → Grayscale → Threshold → 
Staff Line Detection → Staff Removal → Symbol Detection → 
Symbol Classification → Position Mapping → MusicScore Generation
```

### Detailed Steps

#### 1. Pre-processing
- Convert to grayscale
- Apply adaptive thresholding (Otsu's method)
- Deskew using Hough line transform
- Noise reduction (morphological operations)

#### 2. Staff Line Detection
- Detect 5 horizontal parallel lines per staff
- Calculate staff line spacing (used as measurement unit)
- Extract staff regions (crop to relevant areas)

#### 3. Staff Line Removal
- Remove staff lines to isolate symbols
- Preserve note heads and stems

#### 4. Symbol Detection
- Find note heads (filled/hollow circles using contour detection)
- Detect stems (vertical lines attached to note heads)
- Find flags/beams (connected to stems)
- Identify clefs (treble/bass - template matching)
- Detect time signatures (number recognition)

#### 5. Note Classification

**Pitch:** Vertical position relative to staff lines (line/space)

**Duration:**
- Hollow head + no stem = whole note
- Hollow head + stem = half note
- Filled head + stem = quarter note
- Filled head + stem + 1 flag = eighth note
- Filled head + stem + 2 flags = sixteenth note

**Accidentals:** Template matching for #, b, ♮

#### 6. Temporal Ordering
- Sort notes left-to-right
- Assign to measures using bar line detection
- Calculate beat positions

---

## 4. File Structure

### New Components
```
src/components/
  ├── SheetMusicUploadModal.tsx       # Main upload UI
  ├── SheetMusicUploadModal.css       # Styling
  ├── OcrResultsViewer.tsx            # Preview detected notes
  └── OcrResultsViewer.css            # Styling
```

### New Utilities
```
src/utils/
  ├── ocrEngine.ts                    # Main OCR orchestrator
  ├── imagePreprocessing.ts           # Image cleanup functions
  ├── staffDetection.ts               # Staff line detection
  ├── symbolDetection.ts              # Note/symbol detection
  ├── symbolClassification.ts         # Classify detected symbols
  ├── musicScoreBuilder.ts            # Build MusicScore from symbols
  └── templateMatching.ts             # For clefs, accidentals
```

### New Types
```
src/types/
  └── ocr.ts                          # OCR-specific types
```

---

## 5. Type Definitions

```typescript
// src/types/ocr.ts

export interface DetectedStaff {
  lines: number[][];              // Y-coordinates of 5 staff lines
  spacing: number;                // Distance between lines
  boundingBox: { 
    x: number; 
    y: number; 
    width: number; 
    height: number 
  };
}

export interface DetectedSymbol {
  type: 'notehead' | 'stem' | 'flag' | 'beam' | 'clef' | 'accidental';
  position: { x: number; y: number };
  confidence: number;             // 0-1 confidence score
  data?: any;                     // Type-specific data
}

export interface DetectedNote {
  pitch: string;                  // C, D, E, etc.
  octave: number;
  accidental?: 'sharp' | 'flat' | 'natural';
  duration: NoteDuration;
  position: { x: number; y: number }; // Pixel position
  confidence: number;
  staffIndex: number;             // Which staff (for multi-staff)
}

export interface OcrResult {
  detectedNotes: DetectedNote[];
  detectedStaffs: DetectedStaff[];
  timeSignature?: TimeSignature;
  clef?: 'treble' | 'bass';
  confidence: number;             // Overall confidence
}
```

---

## 6. Dependencies

### Phase 1 (MVP) - Choose One:

**Option A: OpenCV.js (More powerful)**
```json
{
  "opencv-ts": "^1.4.0"
}
```

**Option B: Jimp (Lighter weight)**
```json
{
  "jimp": "^0.22.0"
}
```

### Phase 2 (ML Enhancement)
```json
{
  "@tensorflow/tfjs": "^4.13.0",
  "@tensorflow/tfjs-backend-webgl": "^4.13.0"
}
```

---

## 7. Core Algorithms

### Staff Line Detection
```typescript
// Horizontal projection histogram
// Look for peaks corresponding to 5 equally-spaced lines
function detectStaffLines(binaryImage: ImageData): DetectedStaff[] {
  // 1. Horizontal projection (sum pixels per row)
  // 2. Find peaks that repeat 5 times with equal spacing
  // 3. Group into staves
}
```

### Note Head Detection
```typescript
function detectNoteHeads(image: ImageData, staff: DetectedStaff): Point[] {
  // 1. Use blob detection (connected components)
  // 2. Filter by circularity (aspect ratio ~1.0-1.3)
  // 3. Filter by size (relative to staff spacing)
  // 4. Return centers of elliptical blobs
}
```

### Pitch Calculation
```typescript
function calculatePitch(
  noteY: number, 
  staff: DetectedStaff, 
  clef: 'treble' | 'bass'
): { pitch: string; octave: number } {
  const staffPosition = (noteY - staff.lines[0]) / (staff.spacing / 2);
  // staffPosition: 0 = bottom line, 8 = top line, odd = spaces
  
  // Map to musical pitch based on clef
  const trebleMap = ['E5','D5','C5','B4','A4','G4','F4','E4','D4'];
  const bassMap = ['G3','F3','E3','D3','C3','B2','A2','G2','F2'];
  
  const map = clef === 'treble' ? trebleMap : bassMap;
  return parsePitchString(map[staffPosition]);
}
```

---

## 8. User Flow

1. User clicks **"Load Song"** to open the Load Song modal
2. User clicks **"Import from Screenshot"** button in the modal
3. Sheet Music Upload modal opens with upload zone
4. User drags/selects image → Preview shows
5. User clicks **"Process"** → Progress spinner appears
6. OCR runs (1-3 seconds for simple score)
7. Results shown in split view:
   - **Left:** Original image with detected notes highlighted
   - **Right:** Generated staff preview using MusicalStaff component
8. User can click notes to correct:
   - Change pitch (up/down arrows)
   - Change duration (dropdown)
   - Delete false positives (X button)
9. User clicks **"Import"** → Merge into current score or replace
10. Both modals close → Notes appear in main staff

---

## 9. Error Handling & Validation

| Error Condition | Action |
|----------------|--------|
| No staff lines detected | Show error, suggest better image |
| Confidence < 50% | Mark notes in yellow, require review |
| Confidence < 30% | Auto-reject, ask user to correct |
| Duplicate notes at same position | Merge or flag for review |
| Notes outside staff range | Clip to staff or mark as error |
| Invalid durations | Default to quarter notes, flag for review |

---

## 10. Performance Optimizations

- Process image on **Web Worker** to avoid blocking UI
- Downscale large images (max 2000px width) before processing
- Use **OffscreenCanvas** for image operations
- Cache processed results in IndexedDB
- Show incremental progress:
  - Staff detection: 25%
  - Note detection: 50%
  - Classification: 75%
  - Score building: 100%

---

## 11. Feature Limitations (MVP)

### Supported
- ✅ Single staff only (treble clef initially)
- ✅ Simple time signatures (4/4, 3/4, 2/4)
- ✅ Basic note durations (whole, half, quarter, eighth)
- ✅ Printed music only (no handwritten)
- ✅ Clean, high-contrast images
- ✅ Maximum 4 measures per scan
- ✅ Single melody line (no chords)

### Not Supported in MVP
- ❌ Accidentals (sharps, flats, naturals)
- ❌ Rests
- ❌ Chords (multiple simultaneous notes)
- ❌ Grand staff (treble + bass together)
- ❌ Dynamics, articulations, lyrics
- ❌ Handwritten music
- ❌ Complex rhythms (triplets, dotted notes)

---

## 12. Testing Strategy

### Test Dataset
Create synthetic sheet music images using MuseScore/Finale:
- Export at 300 DPI PNG
- Clean, high-contrast rendering

### Test Cases
1. Simple C major scale
2. Twinkle Twinkle (existing song)
3. Quarter notes only
4. Mixed durations (half, quarter, eighth)
5. Notes on lines vs. spaces
6. Skewed images (±5 degrees)
7. Different image sizes

### Unit Tests
```typescript
describe('Staff Detection', () => {
  test('detects 5 staff lines in clean image', () => {});
  test('handles skewed images', () => {});
  test('calculates correct staff spacing', () => {});
});

describe('Note Detection', () => {
  test('detects quarter notes', () => {});
  test('distinguishes filled vs. hollow noteheads', () => {});
  test('calculates correct pitch from position', () => {});
});

describe('Score Building', () => {
  test('converts detected notes to MusicScore format', () => {});
  test('assigns correct measure positions', () => {});
});
```

---

## 13. Progressive Enhancement Path

### MVP (Week 1-2)
- ✅ Basic staff line detection
- ✅ Simple filled note head detection
- ✅ Quarter notes only
- ✅ Treble clef only
- ✅ Manual correction UI

### v1.1 (Week 3)
- 🔄 Multiple note durations (whole, half, quarter, eighth)
- 🔄 Stem direction detection
- 🔄 Bar line detection for measure separation

### v1.2 (Week 4)
- 🔄 Accidentals (sharp, flat, natural)
- 🔄 Time signature detection
- 🔄 Bass clef support

### v2.0 (Future)
- 🔲 TensorFlow.js ML model integration
- 🔲 Handwritten music support
- 🔲 Chord detection (multiple simultaneous notes)
- 🔲 Rests and dotted notes
- 🔲 Grand staff (treble + bass)
- 🔲 Camera integration for real-time scanning

---

## 14. Bundle Size Consideration

### Without ML (Phase 1 only)

**Option A:**
- OpenCV.js: ~8MB (wasm + js)

**Option B:**
- Jimp: ~1MB (pure JS, slower)

**Recommendation:** Start with Jimp for MVP, upgrade to OpenCV if needed

### With ML (Phase 2)
- TensorFlow.js core: ~500KB
- WebGL backend: ~200KB
- Pre-trained model: ~5-10MB
- **Total:** ~15-20MB (lazy load on demand)

---

## 15. Implementation Priority

1. ✅ Create upload modal UI (no OCR yet)
2. ✅ Image preview with zoom/pan
3. ✅ Implement staff line detection
4. ✅ Implement simple note head detection (filled circles only)
5. ✅ Map detected notes to MusicScore format
6. ✅ Show results preview
7. ✅ Manual correction interface
8. ✅ Import to main score
9. 🔄 Add duration detection (stems + flags)
10. 🔄 Add accidentals
11. 🔄 Add ML model (Phase 2)

---

## 16. Success Criteria

### Accuracy Targets (MVP)
- **Staff detection:** 95%+ success rate on clean images
- **Note detection:** 80%+ accuracy on simple quarter note melodies
- **Pitch accuracy:** 90%+ correct pitch assignment
- **Duration accuracy:** 70%+ correct duration (Phase 1.1)

### Performance Targets
- **Processing time:** < 3 seconds for simple 4-measure score
- **UI responsiveness:** No blocking of main thread
- **Bundle size:** < 2MB added (Phase 1 with Jimp)

### User Experience
- Clear error messages for failed processing
- Intuitive correction interface
- Non-destructive import (can undo)
- Progress feedback during processing

---

## 17. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Poor accuracy on real-world images | Start with synthetic test images, add robust correction UI |
| Performance issues with large images | Downscale to max 2000px, use Web Workers |
| Complex notation not supported | Clear documentation of limitations, incremental feature additions |
| Bundle size too large | Use Jimp instead of OpenCV, lazy load ML models |
| Browser compatibility | Test on Chrome, Firefox, Safari; use polyfills if needed |

---

## 18. Future Considerations

- **Mobile support:** Camera integration for scanning physical sheet music
- **Batch processing:** Multiple images at once
- **Export corrections:** Improve model by learning from user corrections
- **Collaborative features:** Share OCR results for community validation
- **Integration with music libraries:** Direct import from IMSLP or Musescore.com

---

## Estimated Timeline

- **MVP (Phase 1 with basic detection):** 2-3 weeks
- **Full Phase 1 (multiple durations, accidentals):** 4-6 weeks
- **Phase 2 (ML integration):** +3-4 weeks

---

## Critical Success Factors

1. **Start simple:** Focus on very basic test cases (C major scale, quarter notes only)
2. **Prioritize accuracy:** Better to detect 10 notes perfectly than 100 notes at 50% accuracy
3. **Build robust correction UI:** OCR will make mistakes; make them easy to fix
4. **Use synthetic test images:** Ensure consistency during development
5. **Iterate based on real usage:** Add features based on actual user needs
