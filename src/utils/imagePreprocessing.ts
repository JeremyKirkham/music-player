/**
 * Image preprocessing utilities for OCR
 * Uses HTML5 Canvas API for image manipulation
 */

/**
 * Load an image from a data URL and return an ImageData object
 */
export async function loadImageData(imageDataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve(imageData)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = imageDataUrl
  })
}

/**
 * Convert ImageData to grayscale
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data)

  for (let i = 0; i < data.length; i += 4) {
    // Use luminance formula: 0.299*R + 0.587*G + 0.114*B
    const gray = Math.round(
      0.299 * data[i] +     // R
      0.587 * data[i + 1] + // G
      0.114 * data[i + 2]   // B
    )
    data[i] = gray     // R
    data[i + 1] = gray // G
    data[i + 2] = gray // B
    // Alpha channel (i+3) remains unchanged
  }

  return new ImageData(data, imageData.width, imageData.height)
}

/**
 * Apply binary threshold (Otsu's method approximation)
 * Converts grayscale image to black and white
 */
export function applyThreshold(imageData: ImageData, threshold?: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)

  // If no threshold provided, calculate using Otsu's method
  let finalThreshold = threshold
  if (finalThreshold === undefined) {
    finalThreshold = calculateOtsuThreshold(imageData)
  }

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] // All RGB channels are the same in grayscale
    const binary = gray > finalThreshold ? 255 : 0
    data[i] = binary
    data[i + 1] = binary
    data[i + 2] = binary
  }

  return new ImageData(data, imageData.width, imageData.height)
}

/**
 * Calculate optimal threshold using Otsu's method
 */
function calculateOtsuThreshold(imageData: ImageData): number {
  const histogram = new Array(256).fill(0)
  const { data, width, height } = imageData
  const totalPixels = width * height

  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++
  }

  // Calculate cumulative sums
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i]
  }

  let sumB = 0
  let wB = 0
  let wF = 0
  let maxVariance = 0
  let threshold = 0

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue

    wF = totalPixels - wB
    if (wF === 0) break

    sumB += t * histogram[t]

    const mB = sumB / wB
    const mF = (sum - sumB) / wF

    const variance = wB * wF * (mB - mF) * (mB - mF)

    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  return threshold
}

/**
 * Create a horizontal projection (sum of pixels per row)
 * Used for staff line detection
 */
export function createHorizontalProjection(imageData: ImageData): number[] {
  const { data, width, height } = imageData
  const projection = new Array(height).fill(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      // Count black pixels (0) as 1, white pixels (255) as 0
      projection[y] += data[i] === 0 ? 1 : 0
    }
  }

  return projection
}

/**
 * Downscale image to a maximum width while maintaining aspect ratio
 * This improves processing speed
 */
export async function downscaleImage(imageDataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width <= maxWidth) {
        resolve(imageDataUrl)
        return
      }

      const scale = maxWidth / width
      width = maxWidth
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL())
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = imageDataUrl
  })
}

/**
 * Convert ImageData to a data URL for display
 */
export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}
