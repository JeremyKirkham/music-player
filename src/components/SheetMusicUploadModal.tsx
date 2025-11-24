import { useCallback, useEffect, useRef, useState } from 'react'
import './SheetMusicUploadModal.css'
import type { MusicScore } from '../types/music'
import type { OcrResult } from '../types/ocr'
import { processSheetMusicImage } from '../utils/ocrEngine'
import { buildMusicScoreFromOcr } from '../utils/musicScoreBuilder'

interface SheetMusicUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (score: MusicScore) => void
}

const SheetMusicUploadModal = ({ isOpen, onClose, onImport }: SheetMusicUploadModalProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAnnotated, setShowAnnotated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setUploadedImage(result)
        }
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please select a valid image file (PNG, JPG, etc.)')
    }
  }

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle drag events
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle click on upload zone
  const handleUploadZoneClick = () => {
    fileInputRef.current?.click()
  }

  // Handle processing the uploaded image with OCR
  const handleProcessImage = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await processSheetMusicImage(uploadedImage)

      if (result.detectedStaffs.length === 0) {
        setError('No staff lines detected. Please upload a clearer image of sheet music.')
        setOcrResult(null)
      } else if (result.detectedNotes.length === 0) {
        setError('No notes detected. Please try a different image.')
        setOcrResult(result)
      } else {
        setOcrResult(result)
        // Automatically show annotated view when detections are successful
        setShowAnnotated(true)
      }
    } catch (err) {
      console.error('OCR processing failed:', err)
      setError('Failed to process image. Please try again.')
      setOcrResult(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle importing the detected notes as a music score
  const handleImport = () => {
    if (!ocrResult || ocrResult.detectedNotes.length === 0) return

    try {
      const musicScore = buildMusicScoreFromOcr(ocrResult)
      onImport(musicScore)
      handleClose()
    } catch (err) {
      console.error('Failed to build music score:', err)
      setError('Failed to import notes. Please try again.')
    }
  }

  // Handle closing modal (reset state)
  const handleClose = useCallback(() => {
    setUploadedImage(null)
    setIsDragging(false)
    setIsProcessing(false)
    setOcrResult(null)
    setError(null)
    setShowAnnotated(false)
    onClose()
  }, [onClose])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content sheet-music-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import from Screenshot</h2>
          <button onClick={handleClose} className="close-button">×</button>
        </div>
        <div className="modal-body">
          {!uploadedImage ? (
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadZoneClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">📷</div>
              <p className="upload-text">Drag and drop an image here</p>
              <p className="upload-subtext">or click to browse</p>
              <p className="upload-formats">Supports PNG, JPG, JPEG</p>
            </div>
          ) : (
            <div className="image-preview-container">
              <div className="image-preview">
                <img
                  src={showAnnotated && ocrResult?.annotatedImageUrl ? ocrResult.annotatedImageUrl : uploadedImage}
                  alt={showAnnotated ? "Annotated sheet music" : "Uploaded sheet music"}
                />
              </div>
              <div className="button-row">
                <button onClick={() => setUploadedImage(null)} className="btn-change-image">
                  Change Image
                </button>
                {!ocrResult && (
                  <button
                    onClick={handleProcessImage}
                    className="btn-process"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Process Image'}
                  </button>
                )}
                {ocrResult?.annotatedImageUrl && (
                  <button
                    onClick={() => setShowAnnotated(!showAnnotated)}
                    className="btn-toggle-view"
                  >
                    {showAnnotated ? '👁️ Show Original' : '🎯 Show Detections'}
                  </button>
                )}
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              {ocrResult && (
                <div className="ocr-results">
                  <h3>Detection Results</h3>
                  <div className="results-summary">
                    <p>
                      <strong>Staves detected:</strong> {ocrResult.detectedStaffs.length}
                    </p>
                    <p>
                      <strong>Notes detected:</strong> {ocrResult.detectedNotes.length}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {Math.round(ocrResult.confidence * 100)}%
                    </p>
                  </div>
                  {ocrResult.detectedNotes.length > 0 && (
                    <div className="detected-notes">
                      <h4>Detected Notes:</h4>
                      <div className="notes-list">
                        {ocrResult.detectedNotes.map((note, idx) => (
                          <div key={idx} className="note-item">
                            {note.pitch}{note.octave}
                            {note.accidental && ` (${note.accidental})`} - {note.duration}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={handleClose} className="btn-cancel">
            {ocrResult && ocrResult.detectedNotes.length > 0 ? 'Cancel' : 'Close'}
          </button>
          {ocrResult && ocrResult.detectedNotes.length > 0 && (
            <button onClick={handleImport} className="btn-import-score">
              Import {ocrResult.detectedNotes.length} Note{ocrResult.detectedNotes.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SheetMusicUploadModal
