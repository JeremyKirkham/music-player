import type { NoteDuration } from './music'

export interface DetectedStaff {
  lines: number[][]              // Y-coordinates of 5 staff lines
  spacing: number                // Distance between lines
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface DetectedSymbol {
  type: 'notehead' | 'stem' | 'flag' | 'beam' | 'clef' | 'accidental'
  position: { x: number; y: number }
  confidence: number             // 0-1 confidence score
  data?: unknown                 // Type-specific data
}

export interface DetectedNote {
  pitch: string                  // C, D, E, etc.
  octave: number
  accidental?: 'sharp' | 'flat' | 'natural'
  duration: NoteDuration
  position: { x: number; y: number } // Pixel position
  confidence: number
  staffIndex: number             // Which staff (for multi-staff)
}

export interface OcrResult {
  detectedNotes: DetectedNote[]
  detectedStaffs: DetectedStaff[]
  timeSignature?: { numerator: number; denominator: number }
  clef?: 'treble' | 'bass'
  confidence: number             // Overall confidence
  annotatedImageUrl?: string     // Image with visual annotations
}
