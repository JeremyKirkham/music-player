import type { DetectedStaff, DetectedNote } from '../types/ocr'
import { calculateStaffPosition, staffPositionToPitch } from './staffDetection'

interface Blob {
  x: number
  y: number
  width: number
  height: number
  pixels: number
}

/**
 * Detect note heads in a binary image
 * Uses blob detection to find filled circular regions
 */
export function detectNoteHeads(
  imageData: ImageData,
  staff: DetectedStaff,
  clef: 'treble' | 'bass' = 'treble'
): DetectedNote[] {
  // First, extract the staff region with some margin
  const margin = staff.spacing * 3
  const staffRegion = extractRegion(
    imageData,
    0,
    Math.max(0, staff.boundingBox.y - margin),
    imageData.width,
    staff.boundingBox.height + margin * 2
  )

  // Find blobs (connected components)
  const blobs = findBlobs(staffRegion)

  // Filter blobs by size and shape to identify likely note heads
  const noteHeadBlobs = filterNoteHeadBlobs(blobs, staff.spacing)

  // Convert blobs to detected notes
  const notes: DetectedNote[] = noteHeadBlobs.map(blob => {
    const absoluteY = blob.y + Math.max(0, staff.boundingBox.y - margin)
    const position = calculateStaffPosition(absoluteY, staff)
    const { pitch, octave } = staffPositionToPitch(position, clef)

    return {
      pitch,
      octave,
      duration: 'quarter', // Default to quarter note for MVP
      position: { x: blob.x, y: absoluteY },
      confidence: 0.8, // Placeholder confidence
      staffIndex: 0,
    }
  })

  // Sort notes by x position (left to right)
  notes.sort((a, b) => a.position.x - b.position.x)

  return notes
}

/**
 * Extract a rectangular region from an ImageData
 */
function extractRegion(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.putImageData(imageData, 0, 0)

  return ctx.getImageData(x, y, width, height)
}

/**
 * Find connected components (blobs) in a binary image
 */
function findBlobs(imageData: ImageData): Blob[] {
  const { data, width, height } = imageData
  const visited = new Array(width * height).fill(false)
  const blobs: Blob[] = []

  function isBlack(x: number, y: number): boolean {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const i = (y * width + x) * 4
    return data[i] === 0 // Black pixel
  }

  function floodFill(startX: number, startY: number): Blob | null {
    const stack: Array<[number, number]> = [[startX, startY]]
    const pixels: Array<[number, number]> = []
    let minX = startX
    let maxX = startX
    let minY = startY
    let maxY = startY

    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const index = y * width + x

      if (visited[index] || !isBlack(x, y)) continue

      visited[index] = true
      pixels.push([x, y])

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)

      // Check 4-connected neighbors
      stack.push([x + 1, y])
      stack.push([x - 1, y])
      stack.push([x, y + 1])
      stack.push([x, y - 1])
    }

    if (pixels.length === 0) return null

    return {
      x: minX + (maxX - minX) / 2,
      y: minY + (maxY - minY) / 2,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixels: pixels.length,
    }
  }

  // Scan image for unvisited black pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      if (!visited[index] && isBlack(x, y)) {
        const blob = floodFill(x, y)
        if (blob) {
          blobs.push(blob)
        }
      }
    }
  }

  return blobs
}

/**
 * Filter blobs to identify likely note heads based on size and shape
 */
function filterNoteHeadBlobs(blobs: Blob[], staffSpacing: number): Blob[] {
  // Note heads are typically about 1-1.5x the staff spacing in size
  const minSize = staffSpacing * 0.5
  const maxSize = staffSpacing * 2.5

  return blobs.filter(blob => {
    // Check size
    const size = Math.max(blob.width, blob.height)
    if (size < minSize || size > maxSize) return false

    // Check aspect ratio (note heads are roughly circular)
    const aspectRatio = blob.width / blob.height
    if (aspectRatio < 0.6 || aspectRatio > 1.7) return false

    // Check that blob has enough pixels (not just a thin line)
    const expectedPixels = (blob.width * blob.height) * 0.3
    if (blob.pixels < expectedPixels) return false

    return true
  })
}
