import { useCallback, useEffect, useRef, useState } from 'react'
import './SheetMusicUploadModal.css'
import type { MusicScore } from '../types/music'

interface SheetMusicUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (score: MusicScore) => void
}

const SheetMusicUploadModal = ({ isOpen, onClose, onImport: _onImport }: SheetMusicUploadModalProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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

  // Handle closing modal (reset state)
  const handleClose = useCallback(() => {
    setUploadedImage(null)
    setIsDragging(false)
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
                <img src={uploadedImage} alt="Uploaded sheet music" />
              </div>
              <button onClick={() => setUploadedImage(null)} className="btn-change-image">
                Change Image
              </button>
              <div className="ocr-placeholder">
                <p>OCR processing will be implemented in the next increment.</p>
                <p>For now, you can upload and preview images.</p>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={handleClose} className="btn-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SheetMusicUploadModal
