import type { DetectedStaff, DetectedNote } from '../types/ocr'

/**
 * Draw annotations on an image showing detected staff lines and notes
 */
export async function annotateImage(
  imageDataUrl: string,
  detectedStaffs: DetectedStaff[],
  detectedNotes: DetectedNote[]
): Promise<string> {
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

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Draw staff lines
      detectedStaffs.forEach((staff, staffIndex) => {
        drawStaffLines(ctx, staff, staffIndex)
      })

      // Draw detected notes
      detectedNotes.forEach((note) => {
        drawNoteAnnotation(ctx, note)
      })

      // Convert to data URL
      resolve(canvas.toDataURL())
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for annotation'))
    }

    img.src = imageDataUrl
  })
}

/**
 * Draw staff lines with highlighting
 */
function drawStaffLines(
  ctx: CanvasRenderingContext2D,
  staff: DetectedStaff,
  staffIndex: number
) {
  const colors = ['#61dafb', '#ff6b6b', '#51cf66', '#ffd43b', '#845ef7']
  const color = colors[staffIndex % colors.length]

  // Draw staff bounding box
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(
    staff.boundingBox.x,
    staff.boundingBox.y,
    staff.boundingBox.width,
    staff.boundingBox.height
  )
  ctx.setLineDash([])

  // Draw individual staff lines
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.6

  for (let i = 0; i < staff.lines.length; i += 2) {
    const [x1, y1] = staff.lines[i]
    const [x2, y2] = staff.lines[i + 1] || staff.lines[i]

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  ctx.globalAlpha = 1.0

  // Draw staff label
  ctx.fillStyle = color
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(
    `Staff ${staffIndex + 1} (spacing: ${Math.round(staff.spacing)}px)`,
    staff.boundingBox.x + 10,
    staff.boundingBox.y - 10
  )
}

/**
 * Draw note annotation with confidence color-coding
 */
function drawNoteAnnotation(ctx: CanvasRenderingContext2D, note: DetectedNote) {
  const { x, y } = note.position
  const { confidence } = note

  // Color-code by confidence
  let color: string
  if (confidence >= 0.7) {
    color = '#51cf66' // Green - high confidence
  } else if (confidence >= 0.4) {
    color = '#ffd43b' // Yellow - medium confidence
  } else {
    color = '#ff6b6b' // Red - low confidence
  }

  // Draw circle around note
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.3

  // Draw filled circle
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, 2 * Math.PI)
  ctx.fill()

  ctx.globalAlpha = 1.0
  ctx.stroke()

  // Draw pitch label
  ctx.fillStyle = color
  ctx.font = 'bold 12px monospace'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 3

  const label = `${note.pitch}${note.octave}${note.accidental ? note.accidental[0] : ''}`

  // Draw text background for better readability
  const textMetrics = ctx.measureText(label)
  const textWidth = textMetrics.width
  const textHeight = 12

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x + 20, y - textHeight - 2, textWidth + 6, textHeight + 6)

  // Draw text
  ctx.fillStyle = color
  ctx.fillText(label, x + 23, y - 2)

  // Draw confidence indicator
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = '9px sans-serif'
  const confLabel = `${Math.round(confidence * 100)}%`
  ctx.fillText(confLabel, x + 23, y + 10)
}

/**
 * Create a side-by-side comparison image
 */
export async function createComparisonImage(
  originalUrl: string,
  annotatedUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const original = new Image()
    const annotated = new Image()

    let loadedCount = 0

    const onLoad = () => {
      loadedCount++
      if (loadedCount === 2) {
        const canvas = document.createElement('canvas')
        const width = Math.max(original.width, annotated.width)
        const height = original.height + annotated.height + 40 // Gap between images

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Draw original
        ctx.fillStyle = '#000'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText('Original Image', 10, 20)
        ctx.drawImage(original, 0, 30)

        // Draw annotated
        const annotatedY = original.height + 60
        ctx.fillText('Detected Elements', 10, annotatedY - 10)
        ctx.drawImage(annotated, 0, annotatedY)

        resolve(canvas.toDataURL())
      }
    }

    const onError = () => {
      reject(new Error('Failed to load images for comparison'))
    }

    original.onload = onLoad
    annotated.onload = onLoad
    original.onerror = onError
    annotated.onerror = onError

    original.src = originalUrl
    annotated.src = annotatedUrl
  })
}

/**
 * Draw a legend explaining the color coding
 */
export function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const legendItems = [
    { color: '#51cf66', label: 'High confidence (≥70%)' },
    { color: '#ffd43b', label: 'Medium confidence (40-70%)' },
    { color: '#ff6b6b', label: 'Low confidence (<40%)' },
  ]

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(x, y, 220, 90)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Confidence Legend', x + 10, y + 20)

  legendItems.forEach((item, index) => {
    const itemY = y + 40 + index * 20

    // Draw color box
    ctx.fillStyle = item.color
    ctx.fillRect(x + 10, itemY - 10, 15, 15)

    // Draw label
    ctx.fillStyle = '#fff'
    ctx.font = '11px sans-serif'
    ctx.fillText(item.label, x + 32, itemY + 2)
  })
}
