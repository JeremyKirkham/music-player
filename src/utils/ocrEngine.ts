import * as tf from '@tensorflow/tfjs'
import type { OcrResult } from '../types/ocr'
import {
  loadImageAsTensor,
  preprocessImageTensor,
  applyBinaryThreshold,
  detectStaffLinesWithTF,
  detectNoteHeadsWithTF,
  cleanup,
} from './tensorflowOcr'
import { annotateImage } from './imageAnnotation'

/**
 * Create image URL from a tensor (already at target dimensions)
 */
async function tensorToImageUrl(tensor: tf.Tensor3D): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const [height, width] = tensor.shape

      canvas.width = width
      canvas.height = height

      // Convert tensor to canvas - toPixels expects float32 in [0, 1] or uint8 in [0, 255]
      tf.browser.toPixels(tensor, canvas).then(() => {
        resolve(canvas.toDataURL())
      }).catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Main OCR engine for processing sheet music images using TensorFlow.js
 * This orchestrates the entire OCR pipeline:
 * 1. Image preprocessing with TensorFlow.js
 * 2. Staff detection using convolution
 * 3. Note detection using pattern matching
 * 4. Symbol classification
 * 5. Music score generation
 */
export async function processSheetMusicImage(imageDataUrl: string): Promise<OcrResult> {
  let imageTensor: tf.Tensor3D | null = null
  let preprocessed: tf.Tensor3D | null = null
  let binary: tf.Tensor3D | null = null

  try {
    console.log('Starting TensorFlow.js OCR pipeline...')

    // Step 1: Load image as TensorFlow.js tensor
    console.log('Loading image as tensor...')
    imageTensor = await loadImageAsTensor(imageDataUrl)
    console.log('Image tensor shape:', imageTensor.shape)

    // Step 2: Preprocess image (resize, grayscale, normalize)
    console.log('Preprocessing image...')
    preprocessed = preprocessImageTensor(imageTensor, 1200)

    // Step 3: Create image URL from preprocessed tensor for annotation (BEFORE converting to binary)
    console.log('Creating image URL from preprocessed tensor...')

    // Need to convert grayscale back to RGB for display
    const grayscaleRgb = tf.tidy(() => {
      if (!preprocessed) throw new Error('Preprocessed tensor is null')

      // preprocessed is grayscale [H, W, 1] with values in [0, 1]
      // tf.browser.toPixels expects float32 in [0, 1] or uint8 in [0, 255]
      // Just replicate the grayscale channel to RGB without scaling
      return tf.concat([preprocessed, preprocessed, preprocessed], 2) as tf.Tensor3D
    })

    const downscaledImageUrl = await tensorToImageUrl(grayscaleRgb)
    grayscaleRgb.dispose()

    // Step 4: Apply binary threshold
    console.log('Applying binary threshold...')
    binary = applyBinaryThreshold(preprocessed, 0.7) // Increased from 0.5 to capture fainter staff lines

    // Step 5: Detect staff lines
    console.log('Detecting staff lines with TensorFlow.js...')
    const detectedStaffs = await detectStaffLinesWithTF(binary)
    console.log(`Detected ${detectedStaffs.length} staff(s)`)

    if (detectedStaffs.length === 0) {
      // Clean up tensors
      imageTensor.dispose()
      preprocessed.dispose()
      binary.dispose()

      return {
        detectedNotes: [],
        detectedStaffs: [],
        confidence: 0,
      }
    }

    // Step 6: Detect notes on the first staff (MVP: single staff only)
    console.log('Detecting notes with TensorFlow.js...')
    const detectedNotes = await detectNoteHeadsWithTF(binary, detectedStaffs[0], 'treble')
    console.log(`Detected ${detectedNotes.length} note(s)`)

    // Calculate overall confidence
    const avgConfidence =
      detectedNotes.length > 0
        ? detectedNotes.reduce((sum, note) => sum + note.confidence, 0) /
          detectedNotes.length
        : 0

    console.log('TensorFlow.js OCR pipeline complete!')
    console.log('Memory usage:', tf.memory())

    // Clean up tensors
    imageTensor.dispose()
    preprocessed.dispose()
    binary.dispose()
    cleanup()

    // Generate annotated image using the downscaled version for coordinate consistency
    console.log('Generating annotated image...')
    const annotatedImageUrl = await annotateImage(downscaledImageUrl, detectedStaffs, detectedNotes)

    return {
      detectedNotes,
      detectedStaffs,
      clef: 'treble',
      confidence: avgConfidence,
      annotatedImageUrl,
    }
  } catch (error) {
    console.error('TensorFlow.js OCR processing error:', error)

    // Clean up tensors in case of error
    if (imageTensor) imageTensor.dispose()
    if (preprocessed) preprocessed.dispose()
    if (binary) binary.dispose()

    throw error
  }
}
