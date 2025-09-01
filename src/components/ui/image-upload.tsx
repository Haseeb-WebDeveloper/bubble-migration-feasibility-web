'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from './button'
import { Card } from './card'
import { cn } from '@/lib/utils'
import { Upload, X, Camera, Loader2, Check } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  onUpload?: (file: File) => Promise<string | null>
  className?: string
  placeholder?: string
  aspectRatio?: 'square' | 'banner' | 'auto'
  maxSize?: number // in MB
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  className,
  placeholder = 'Upload image',
  aspectRatio = 'square',
  maxSize = 5,
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square'
      case 'banner':
        return 'aspect-[3/1]'
      default:
        return ''
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    if (!onUpload) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert(`Image size must be less than ${maxSize}MB`)
      return
    }

    setIsUploading(true)
    try {
      const url = await onUpload(file)
      if (url) {
        onChange(url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [onUpload, onChange, maxSize])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || !e.dataTransfer.files?.[0]) return
    
    handleFileSelect(e.dataTransfer.files[0])
  }, [disabled, handleFileSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files?.[0]) return
    handleFileSelect(e.target.files[0])
  }

  const handleRemove = () => {
    onChange(null)
  }

  const openFileDialog = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      setCameraStream(stream)
      setShowCamera(true)
      
      // Set video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions and try again.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
    setCapturedImage(null)
  }, [cameraStream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageDataUrl)
  }, [])

  const useCapturedPhoto = useCallback(async () => {
    if (!capturedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      
      // Create file from blob
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      })

      // Stop camera and close modal
      stopCamera()

      // Upload the captured image
      await handleFileSelect(file)
    } catch (error) {
      console.error('Error processing captured image:', error)
      alert('Failed to process captured image. Please try again.')
    }
  }, [capturedImage, stopCamera, handleFileSelect])

  const retryCameraCapture = useCallback(() => {
    setCapturedImage(null)
  }, [])

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <Card
        className={cn(
          'relative overflow-hidden border-2 border-dashed transition-colors',
          getAspectRatioClass(),
          dragActive && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {value ? (
          <div className="relative w-full h-full group">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    openFileDialog()
                  }}
                  disabled={disabled}
                  title="Upload from files"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    startCamera()
                  }}
                  disabled={disabled}
                  title="Take photo with camera"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  disabled={disabled}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to upload
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      startCamera()
                    }}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Camera
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, WebP up to {maxSize}MB
                </p>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Take Photo</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopCamera}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              {capturedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={capturedImage}
                      alt="Captured photo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={retryCameraCapture}
                      disabled={isUploading}
                    >
                      Retake
                    </Button>
                    <Button
                      onClick={useCapturedPhoto}
                      disabled={isUploading}
                      className="min-w-[100px]"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Use Photo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="rounded-full w-16 h-16 p-0"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Position yourself in the frame and click the camera button to take a photo
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}