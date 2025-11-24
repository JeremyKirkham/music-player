import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import type { DetectedStaff, DetectedNote } from '../types/ocr'

// Initialize TensorFlow.js backend
let backendInitialized = false

async function ensureBackendInitialized() {
  if (!backendInitialized) {
    await tf.ready()
    await tf.setBackend('webgl')
    backendInitialized = true
    console.log('TensorFlow.js backend initialized:', tf.getBackend())
  }
}

/**
 * Load an image from a data URL and convert to a TensorFlow.js tensor
 */
export async function loadImageAsTensor(imageDataUrl: string): Promise<tf.Tensor3D> {
  await ensureBackendInitialized()

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Convert image to tensor
      const tensor = tf.browser.fromPixels(img)
      resolve(tensor as tf.Tensor3D)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = imageDataUrl
  })
}

/**
 * Preprocess image tensor for OCR
 * - Resize to consistent dimensions
 * - Convert to grayscale
 * - Normalize values
 */
export function preprocessImageTensor(
  imageTensor: tf.Tensor3D,
  targetWidth = 1200
): tf.Tensor3D {
  return tf.tidy(() => {
    // Get current dimensions
    const [height, width] = imageTensor.shape
    console.log(`Original image dimensions: ${height}x${width}`)

    // Calculate new dimensions maintaining aspect ratio
    const scale = targetWidth / width
    const newHeight = Math.round(height * scale)

    // Resize image
    const resized = tf.image.resizeBilinear(imageTensor, [newHeight, targetWidth])
    console.log(`Resized to: ${newHeight}x${targetWidth}`)

    // Convert to grayscale using luminance formula: 0.299*R + 0.587*G + 0.114*B
    const grayscale = tf.mean(resized, -1, true)

    // Normalize to [0, 1]
    const normalized = grayscale.div(255.0)

    return normalized as tf.Tensor3D
  })
}

/**
 * Apply binary threshold to separate foreground (notes) from background
 */
export function applyBinaryThreshold(
  imageTensor: tf.Tensor3D,
  threshold = 0.5
): tf.Tensor3D {
  return tf.tidy(() => {
    // Create binary mask where pixels < threshold become 0 (black), others become 1 (white)
    const binary = tf.where(
      tf.less(imageTensor, threshold),
      tf.zeros(imageTensor.shape),
      tf.ones(imageTensor.shape)
    )
    return binary as tf.Tensor3D
  })
}

/**
 * Detect staff lines using horizontal projection with TensorFlow.js
 */
export async function detectStaffLinesWithTF(
  binaryTensor: tf.Tensor3D
): Promise<DetectedStaff[]> {
  await ensureBackendInitialized()

  const [, width] = binaryTensor.shape

  // Sum pixels horizontally for each row (horizontal projection)
  const horizontalProjection = tf.tidy(() => {
    return tf.sum(binaryTensor, 1).squeeze()
  })

  // Convert to array for processing
  const projectionArray = (await horizontalProjection.array()) as number[]
  horizontalProjection.dispose()

  // Find peaks (rows with many black pixels, which in binary are 0s)
  // Since we inverted for processing, high values = staff lines
  const threshold = width * 0.15 // Lowered from 0.3 to catch more staff lines
  const peaks: number[] = []
  const debugValues: Array<{y: number, value: number}> = []

  console.log(`DEBUG: Image height=${projectionArray.length}, width=${width}, threshold=${threshold}`)

  for (let i = 1; i < projectionArray.length - 1; i++) {
    const value = width - projectionArray[i] // Invert back

    // Log values around expected staff line positions for debugging
    if (i >= 390 && i <= 420) {
      debugValues.push({y: i, value})
    }

    if (
      value > threshold &&
      value > width - projectionArray[i - 1] &&
      value > width - projectionArray[i + 1]
    ) {
      peaks.push(i)
    }
  }

  console.log(`DEBUG: Sample values (y=390-420):`, debugValues.slice(0, 10))

  // Find max projection value to understand the range
  let maxProjection = 0
  for (let i = 0; i < projectionArray.length; i++) {
    const value = width - projectionArray[i]
    maxProjection = Math.max(maxProjection, value)
  }
  console.log(`DEBUG: Max projection value: ${maxProjection}, threshold: ${threshold}, ratio: ${(threshold/maxProjection).toFixed(2)}`)

  console.log(`DEBUG: Found ${peaks.length} raw peaks:`, peaks)

  // Merge nearby peaks
  const mergedPeaks = mergePeaks(peaks, 3)
  console.log(`Found ${peaks.length} peaks, merged to ${mergedPeaks.length} peaks`)
  console.log(`DEBUG: After merging:`, mergedPeaks)

  // Group peaks into staves (sets of 5 equally-spaced lines)
  const staves = groupPeaksIntoStaves(mergedPeaks, width)
  console.log(`Grouped into ${staves.length} staves`)

  if (staves.length > 0) {
    console.log(`First staff: spacing=${staves[0].spacing}, y=${staves[0].boundingBox.y}`)
  }

  return staves
}

/**
 * Detect note heads using TensorFlow.js operations
 */
export async function detectNoteHeadsWithTF(
  binaryTensor: tf.Tensor3D,
  staff: DetectedStaff,
  clef: 'treble' | 'bass' = 'treble'
): Promise<DetectedNote[]> {
  await ensureBackendInitialized()

  const [height, width] = binaryTensor.shape

  // Extract staff region
  const margin = staff.spacing * 3
  const startY = Math.max(0, staff.boundingBox.y - margin)
  const endY = Math.min(height, staff.boundingBox.y + staff.boundingBox.height + margin)
  const staffHeight = endY - startY

  // Use convolution to detect circular blobs (note heads)
  const kernelSize = Math.round(staff.spacing * 1.2)

  const convolved = tf.tidy(() => {
    const staffRegion = tf.slice(binaryTensor, [startY, 0, 0], [staffHeight, width, 1])

    // Invert the image so notes (originally 0) become 1, background (originally 1) becomes 0
    // This way, convolution gives high responses over note heads
    const inverted = tf.sub(1, staffRegion)

    // Create a circular kernel
    const kernel = createCircularKernel(kernelSize)

    // Apply convolution
    const staffRegion4D = inverted.expandDims(0) as tf.Tensor4D // Add batch dimension
    const result = tf.conv2d(
      staffRegion4D,
      kernel,
      1, // stride
      'same' // padding
    )

    return result.squeeze()
  })

  // Find local maxima in the convolution result
  const convolvedArray = (await convolved.array()) as number[][]
  convolved.dispose()

  const notes: DetectedNote[] = []

  // Simple non-maximum suppression
  const minDistance = Math.round(staff.spacing * 0.8)
  const detectionThreshold = kernelSize * kernelSize * 0.3 // Lower threshold for better detection

  // Debug: log max convolution value
  let maxConvValue = 0
  for (let y = 0; y < convolvedArray.length; y++) {
    for (let x = 0; x < convolvedArray[y].length; x++) {
      maxConvValue = Math.max(maxConvValue, convolvedArray[y][x])
    }
  }
  console.log(`Max convolution value: ${maxConvValue}, threshold: ${detectionThreshold}, kernel size: ${kernelSize}`)

  for (let y = 0; y < convolvedArray.length; y++) {
    for (let x = 0; x < convolvedArray[y].length; x++) {
      const value = convolvedArray[y][x]

      if (value > detectionThreshold) {
        // Check if this is a local maximum
        let isLocalMax = true
        for (let dy = -minDistance; dy <= minDistance && isLocalMax; dy++) {
          for (let dx = -minDistance; dx <= minDistance && isLocalMax; dx++) {
            if (dy === 0 && dx === 0) continue
            const ny = y + dy
            const nx = x + dx
            if (
              ny >= 0 &&
              ny < convolvedArray.length &&
              nx >= 0 &&
              nx < convolvedArray[ny].length
            ) {
              if (convolvedArray[ny][nx] > value) {
                isLocalMax = false
              }
            }
          }
        }

        if (isLocalMax) {
          // Convert to absolute coordinates
          const absoluteY = y + startY

          // Calculate pitch from position
          const position = calculateStaffPosition(absoluteY, staff)
          const { pitch, octave } = staffPositionToPitch(position, clef)

          notes.push({
            pitch,
            octave,
            duration: 'quarter', // Default duration
            position: { x, y: absoluteY },
            confidence: Math.min(value / (kernelSize * kernelSize), 1.0),
            staffIndex: 0,
          })
        }
      }
    }
  }

  // Sort notes by x position
  notes.sort((a, b) => a.position.x - b.position.x)

  console.log(`Detected ${notes.length} notes after non-maximum suppression`)

  return notes
}

/**
 * Create a circular convolution kernel for detecting note heads
 */
function createCircularKernel(size: number): tf.Tensor4D {
  return tf.tidy(() => {
    const center = size / 2
    const radius = size / 2.5

    const kernel = tf.buffer([size, size, 1, 1])

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Create filled circle
        if (distance <= radius) {
          kernel.set(1.0, y, x, 0, 0)
        } else {
          kernel.set(0.0, y, x, 0, 0)
        }
      }
    }

    return kernel.toTensor() as tf.Tensor4D
  })
}

/**
 * Merge nearby peaks
 */
function mergePeaks(peaks: number[], maxDistance: number): number[] {
  if (peaks.length === 0) return []

  const merged: number[] = [peaks[0]]

  for (let i = 1; i < peaks.length; i++) {
    const lastMerged = merged[merged.length - 1]
    if (peaks[i] - lastMerged <= maxDistance) {
      merged[merged.length - 1] = Math.round((lastMerged + peaks[i]) / 2)
    } else {
      merged.push(peaks[i])
    }
  }

  return merged
}

/**
 * Group peaks into staves - improved to find all staves on the page
 */
function groupPeaksIntoStaves(peaks: number[], imageWidth: number): DetectedStaff[] {
  if (peaks.length < 5) return []

  console.log(`DEBUG: Total peaks detected: ${peaks.length}`)
  console.log(`DEBUG: Peak positions:`, peaks.slice(0, 20)) // Show first 20 peaks

  // First, find all potential 5-line groups with equal spacing
  const potentialStaves: Array<{ indices: number[]; staff: DetectedStaff; avgSpacing: number }> = []

  for (let i = 0; i <= peaks.length - 5; i++) {
    const indices = [i, i + 1, i + 2, i + 3, i + 4]
    const group = indices.map(idx => peaks[idx])
    const spacings = []

    for (let j = 0; j < group.length - 1; j++) {
      spacings.push(group[j + 1] - group[j])
    }

    const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length
    const isEquallySpaced = spacings.every(
      s => Math.abs(s - avgSpacing) / avgSpacing < 0.3
    )

    const passesSpacingBounds = avgSpacing > 5 && avgSpacing < 50

    if (i < 10 || (isEquallySpaced && passesSpacingBounds)) {
      console.log(`DEBUG: Group ${i}: y=[${group.join(', ')}], spacings=[${spacings.map(s => s.toFixed(1)).join(', ')}], avg=${avgSpacing.toFixed(2)}, equal=${isEquallySpaced}, bounds=${passesSpacingBounds}`)
    }

    if (isEquallySpaced && passesSpacingBounds) {
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

      potentialStaves.push({ indices, staff, avgSpacing })
    }
  }

  console.log(`Found ${potentialStaves.length} potential staves`)

  // Now filter out overlapping staves, keeping the best ones
  const usedPeaks = new Set<number>()
  const finalStaves: DetectedStaff[] = []

  // Sort by quality (tighter spacing variance = better)
  potentialStaves.sort((a, b) => {
    const varianceA = calculateSpacingVariance(a.indices.map(i => peaks[i]))
    const varianceB = calculateSpacingVariance(b.indices.map(i => peaks[i]))
    return varianceA - varianceB
  })

  for (const { indices, staff } of potentialStaves) {
    // Check if any of these peaks are already used
    const hasOverlap = indices.some(idx => usedPeaks.has(idx))

    if (!hasOverlap) {
      // Mark these peaks as used
      indices.forEach(idx => usedPeaks.add(idx))
      finalStaves.push(staff)
      console.log(`Added staff at y=${staff.boundingBox.y}, spacing=${staff.spacing.toFixed(2)}`)
    } else {
      console.log(`DEBUG: Rejected staff at y=${staff.boundingBox.y} due to overlap with indices:`, indices.filter(idx => usedPeaks.has(idx)))
    }
  }

  // Sort staves by vertical position (top to bottom)
  finalStaves.sort((a, b) => a.boundingBox.y - b.boundingBox.y)

  return finalStaves
}

/**
 * Calculate variance in spacing between staff lines
 */
function calculateSpacingVariance(group: number[]): number {
  const spacings = []
  for (let j = 0; j < group.length - 1; j++) {
    spacings.push(group[j + 1] - group[j])
  }
  const avg = spacings.reduce((a, b) => a + b, 0) / spacings.length
  const variance = spacings.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / spacings.length
  return variance
}

/**
 * Calculate staff position from y-coordinate
 */
function calculateStaffPosition(y: number, staff: DetectedStaff): number {
  const bottomLine = staff.lines[0][1]
  const halfSpacing = staff.spacing / 2
  const position = Math.round((bottomLine - y) / halfSpacing)
  return position
}

/**
 * Map staff position to pitch
 */
function staffPositionToPitch(
  position: number,
  clef: 'treble' | 'bass'
): { pitch: string; octave: number } {
  const trebleMap = [
    { pitch: 'E', octave: 4 },
    { pitch: 'F', octave: 4 },
    { pitch: 'G', octave: 4 },
    { pitch: 'A', octave: 4 },
    { pitch: 'B', octave: 4 },
    { pitch: 'C', octave: 5 },
    { pitch: 'D', octave: 5 },
    { pitch: 'E', octave: 5 },
    { pitch: 'F', octave: 5 },
  ]

  const bassMap = [
    { pitch: 'G', octave: 2 },
    { pitch: 'A', octave: 2 },
    { pitch: 'B', octave: 2 },
    { pitch: 'C', octave: 3 },
    { pitch: 'D', octave: 3 },
    { pitch: 'E', octave: 3 },
    { pitch: 'F', octave: 3 },
    { pitch: 'G', octave: 3 },
    { pitch: 'A', octave: 3 },
  ]

  const map = clef === 'treble' ? trebleMap : bassMap
  const clampedPosition = Math.max(0, Math.min(8, position))
  return map[clampedPosition]
}

/**
 * Clean up TensorFlow.js resources
 */
export function cleanup() {
  const numTensors = tf.memory().numTensors
  console.log(`TensorFlow.js cleanup - tensors before: ${numTensors}`)
  // TensorFlow.js will automatically clean up tensors outside of tidy blocks
}
