import type { DetectedStaff } from '../types/ocr'
import { createHorizontalProjection } from './imagePreprocessing'

/**
 * Detect staff lines in a binary image
 * Returns detected staff structures
 */
export function detectStaffLines(imageData: ImageData): DetectedStaff[] {
  const projection = createHorizontalProjection(imageData)
  const peaks = findPeaks(projection, imageData.width)

  // Group peaks into staves (sets of 5 lines)
  const staves = groupPeaksIntoStaves(peaks, imageData.width)

  return staves
}

/**
 * Find peaks in the horizontal projection that likely correspond to staff lines
 */
function findPeaks(projection: number[], imageWidth: number): number[] {
  const peaks: number[] = []

  // Calculate threshold as a percentage of image width
  // Staff lines should span most of the width
  const threshold = imageWidth * 0.3

  // Find local maxima that exceed threshold
  for (let i = 1; i < projection.length - 1; i++) {
    if (
      projection[i] > threshold &&
      projection[i] > projection[i - 1] &&
      projection[i] > projection[i + 1]
    ) {
      peaks.push(i)
    }
  }

  // Merge nearby peaks (within a few pixels of each other)
  return mergePeaks(peaks, 3)
}

/**
 * Merge peaks that are very close together
 */
function mergePeaks(peaks: number[], maxDistance: number): number[] {
  if (peaks.length === 0) return []

  const merged: number[] = [peaks[0]]

  for (let i = 1; i < peaks.length; i++) {
    const lastMerged = merged[merged.length - 1]
    if (peaks[i] - lastMerged <= maxDistance) {
      // Replace with average position
      merged[merged.length - 1] = Math.round((lastMerged + peaks[i]) / 2)
    } else {
      merged.push(peaks[i])
    }
  }

  return merged
}

/**
 * Group detected peaks into staves (sets of 5 equally-spaced lines)
 */
function groupPeaksIntoStaves(peaks: number[], imageWidth: number): DetectedStaff[] {
  const staves: DetectedStaff[] = []

  if (peaks.length < 5) {
    return staves // Not enough lines detected
  }

  // Try to find groups of 5 equally-spaced lines
  for (let i = 0; i <= peaks.length - 5; i++) {
    const group = peaks.slice(i, i + 5)
    const spacings = []

    // Calculate spacings between consecutive lines
    for (let j = 0; j < group.length - 1; j++) {
      spacings.push(group[j + 1] - group[j])
    }

    // Check if spacings are roughly equal (within 30% tolerance)
    const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length
    const isEquallySpaced = spacings.every(
      s => Math.abs(s - avgSpacing) / avgSpacing < 0.3
    )

    if (isEquallySpaced && avgSpacing > 5) {
      // This looks like a valid staff
      const staff: DetectedStaff = {
        lines: group.map(y => [
          [0, y],
          [imageWidth, y]
        ] as number[][]).flat(1),
        spacing: avgSpacing,
        boundingBox: {
          x: 0,
          y: group[0],
          width: imageWidth,
          height: group[4] - group[0] + avgSpacing
        }
      }

      // Check if this staff overlaps with already detected staves
      const overlaps = staves.some(existingStaff =>
        Math.abs(existingStaff.boundingBox.y - staff.boundingBox.y) < avgSpacing * 2
      )

      if (!overlaps) {
        staves.push(staff)
      }

      // Skip ahead to avoid detecting overlapping groups
      i += 4
    }
  }

  return staves
}

/**
 * Calculate the vertical position of a pitch relative to a staff
 * Returns the staff position (0 = bottom line, 8 = top line, odd numbers = spaces)
 */
export function calculateStaffPosition(y: number, staff: DetectedStaff): number {
  const bottomLine = staff.lines[0][1]
  const halfSpacing = staff.spacing / 2
  const position = Math.round((bottomLine - y) / halfSpacing)
  return position
}

/**
 * Map staff position to pitch based on clef
 */
export function staffPositionToPitch(
  position: number,
  clef: 'treble' | 'bass'
): { pitch: string; octave: number } {
  // Treble clef: bottom line (0) = E4, top line (8) = F5
  const trebleMap = [
    { pitch: 'E', octave: 4 }, // 0 - bottom line
    { pitch: 'F', octave: 4 }, // 1 - space
    { pitch: 'G', octave: 4 }, // 2 - line
    { pitch: 'A', octave: 4 }, // 3 - space
    { pitch: 'B', octave: 4 }, // 4 - line
    { pitch: 'C', octave: 5 }, // 5 - space
    { pitch: 'D', octave: 5 }, // 6 - line
    { pitch: 'E', octave: 5 }, // 7 - space
    { pitch: 'F', octave: 5 }, // 8 - top line
  ]

  // Bass clef: bottom line (0) = G2, top line (8) = A3
  const bassMap = [
    { pitch: 'G', octave: 2 }, // 0 - bottom line
    { pitch: 'A', octave: 2 }, // 1 - space
    { pitch: 'B', octave: 2 }, // 2 - line
    { pitch: 'C', octave: 3 }, // 3 - space
    { pitch: 'D', octave: 3 }, // 4 - line
    { pitch: 'E', octave: 3 }, // 5 - space
    { pitch: 'F', octave: 3 }, // 6 - line
    { pitch: 'G', octave: 3 }, // 7 - space
    { pitch: 'A', octave: 3 }, // 8 - top line
  ]

  const map = clef === 'treble' ? trebleMap : bassMap

  // Clamp position to valid range
  const clampedPosition = Math.max(0, Math.min(8, position))

  return map[clampedPosition]
}
