/**
 * Music Notation Type Definitions
 * Comprehensive types for music score representation
 */

// Individual note within a chord or single note
export interface Note {
  pitch: string           // e.g., "C", "D", "E"
  octave: number         // e.g., 4, 5, 6
  accidental?: 'sharp' | 'flat' | 'natural'  // Optional: #, b, or natural sign
  clef: 'treble' | 'bass'
}

// Duration types for notes and rests
export type NoteDuration =
  | 'whole'           // 1
  | 'half'            // 1/2
  | 'quarter'         // 1/4
  | 'eighth'          // 1/8
  | 'sixteenth'       // 1/16
  | 'dotted-half'     // 3/4
  | 'dotted-quarter'  // 3/8
  | 'dotted-eighth'   // 3/16

// Beam grouping for connecting eighth notes, sixteenth notes, etc.
export interface BeamGroup {
  id: string                    // UUID for unique identification
  eventIds: string[]            // IDs of events in this beam group (in order)
  type: 'beam'                  // Type of grouping
}

// A single musical event (can be a note, chord, or rest)
export interface MusicalEvent {
  id: string                    // UUID for unique identification
  type: 'note' | 'rest'
  duration: NoteDuration
  notes?: Note[]                // Array to support chords (empty for rests)
  position: {
    measureIndex: number        // Which measure (0-indexed)
    beatPosition: number        // Position within measure (0-indexed, fractional for subdivisions)
  }
  beamGroupId?: string          // Optional: ID of beam group this event belongs to
}

// Time signature
export interface TimeSignature {
  numerator: number      // Beats per measure (top number)
  denominator: number    // Note value that gets one beat (bottom number)
}

// Measure grouping (optional, for organization)
export interface Measure {
  index: number
  events: string[]              // Event IDs in this measure
  beamGroups: string[]          // Beam group IDs in this measure
  timeSignature: TimeSignature  // Allow changing time signature mid-piece
}

// Score metadata
export interface ScoreMetadata {
  title?: string
  composer?: string
  tempo?: number              // BPM
  keySignature?: string       // e.g., "C", "G", "Dm"
  createdAt: string          // ISO 8601 timestamp
  modifiedAt: string         // ISO 8601 timestamp
  version: string            // Schema version for future migrations
}

// Complete composition/score
export interface MusicScore {
  metadata: ScoreMetadata
  timeSignature: TimeSignature  // Default time signature
  measures: Measure[]
  events: MusicalEvent[]        // All events in chronological order
  beamGroups: BeamGroup[]       // All beam groups in the score
}
