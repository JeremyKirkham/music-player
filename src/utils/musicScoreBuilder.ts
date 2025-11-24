import type { MusicScore, MusicalEvent, Measure, Note } from '../types/music'
import type { OcrResult } from '../types/ocr'

/**
 * Convert OCR detection results into a playable MusicScore
 */
export function buildMusicScoreFromOcr(ocrResult: OcrResult): MusicScore {
  const { detectedNotes, clef = 'treble', timeSignature } = ocrResult

  // Default to 4/4 time if not detected
  const defaultTimeSignature = timeSignature || { numerator: 4, denominator: 4 }

  // Convert detected notes to musical events
  const events: MusicalEvent[] = detectedNotes.map((detectedNote, index) => {
    const note: Note = {
      pitch: detectedNote.pitch,
      octave: detectedNote.octave,
      accidental: detectedNote.accidental,
      clef,
    }

    // Calculate position in measures
    // For MVP, distribute notes evenly across measures
    const beatsPerMeasure = defaultTimeSignature.numerator

    // Simple sequential placement - calculate total beats from all previous notes
    let currentBeat = 0
    for (let i = 0; i < index; i++) {
      currentBeat += durationToBeats(detectedNotes[i].duration, defaultTimeSignature.denominator)
    }

    const measureIndex = Math.floor(currentBeat / beatsPerMeasure)
    const beatPosition = currentBeat % beatsPerMeasure

    const event: MusicalEvent = {
      id: `ocr-note-${index}`,
      type: 'note',
      duration: detectedNote.duration,
      notes: [note],
      position: {
        measureIndex,
        beatPosition,
      },
    }

    return event
  })

  // Group events into measures
  const measures = createMeasures(events, defaultTimeSignature)

  // Create score metadata
  const now = new Date().toISOString()
  const metadata = {
    title: 'Imported from Screenshot',
    composer: 'OCR Import',
    tempo: 120,
    createdAt: now,
    modifiedAt: now,
    version: '1.0',
  }

  return {
    metadata,
    timeSignature: defaultTimeSignature,
    measures,
    events,
    beamGroups: [], // No beam groups for MVP
  }
}

/**
 * Convert note duration to number of beats
 */
function durationToBeats(duration: string, denominator: number): number {
  const beatValue = 4 / denominator // How many quarter notes = 1 beat

  const durationMap: Record<string, number> = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
    'dotted-half': 3,
    'dotted-quarter': 1.5,
    'dotted-eighth': 0.75,
  }

  const quarterNoteEquivalent = durationMap[duration] || 1
  return quarterNoteEquivalent * beatValue
}

/**
 * Group events into measures based on their positions
 */
function createMeasures(events: MusicalEvent[], timeSignature: { numerator: number; denominator: number }): Measure[] {
  const measures: Measure[] = []

  if (events.length === 0) {
    return measures
  }

  // Find the maximum measure index
  const maxMeasureIndex = Math.max(...events.map(e => e.position.measureIndex))

  // Create measures from 0 to maxMeasureIndex
  for (let i = 0; i <= maxMeasureIndex; i++) {
    const measureEvents = events
      .filter(e => e.position.measureIndex === i)
      .map(e => e.id)

    measures.push({
      index: i,
      events: measureEvents,
      beamGroups: [],
      timeSignature,
    })
  }

  return measures
}
