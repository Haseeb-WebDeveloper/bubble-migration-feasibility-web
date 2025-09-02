"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { Upload, X, Camera, Loader2, Check } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string | null>;
  className?: string;
  placeholder?: string;
  aspectRatio?: "square" | "banner" | "auto";
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  className,
  placeholder = "Upload image",
  aspectRatio = "square",
  maxSize = 5,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "banner":
        return "aspect-[3/1]";
      default:
        return "";
    }
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!onUpload) return;

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPEG, PNG, or WebP)");
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        alert(`Image size must be less than ${maxSize}MB`);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate progress for user feedback
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const url = await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (url) {
          onChange(url);
        }

        // Reset progress after a short delay
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
        setUploadProgress(0);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onChange, maxSize]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || !e.dataTransfer.files?.[0]) return;

      handleFileSelect(e.dataTransfer.files[0]);
    },
    [disabled, handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files?.[0]) return;
    handleFileSelect(e.target.files[0]);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setShowCamera(true); // Show modal first

      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      console.log("Camera stream obtained:", stream.getTracks());

      // Wait a bit for the modal to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (videoRef.current) {
        console.log("Setting video source...");
        videoRef.current.srcObject = stream;

        // Play the video explicitly
        try {
          await videoRef.current.play();
          console.log("Video playing");
        } catch (playError) {
          console.error("Error playing video:", playError);
        }
      }

      setCameraStream(stream);
      console.log("Camera setup complete");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Unable to access camera. Please check permissions and try again."
      );

      // Clean up stream if it was created
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
  }, [cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
    setCameraError(null);

    // Clean up video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    console.log("Capture photo clicked");

    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      alert("Camera not ready. Please try again.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Cannot get canvas context");
      alert("Canvas not available. Please try again.");
      return;
    }

    // Simple check - just see if video has dimensions
    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;

    console.log("Capturing photo with dimensions:", width, "x", height);

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    try {
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, width, height);

      // Get image data
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      console.log(
        "Image captured successfully, data URL length:",
        imageDataUrl.length
      );

      if (imageDataUrl && imageDataUrl !== "data:,") {
        setCapturedImage(imageDataUrl);
      } else {
        console.error("Failed to capture image data");
        alert("Failed to capture image. Please try again.");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      alert("Failed to capture image. Please try again.");
    }
  }, []);

  const useCapturedPhoto = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create file from blob
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Stop camera and close modal
      stopCamera();

      // Upload the captured image
      await handleFileSelect(file);
    } catch (error) {
      console.error("Error processing captured image:", error);
      alert("Failed to process captured image. Please try again.");
    }
  }, [capturedImage, stopCamera, handleFileSelect]);

  const retryCameraCapture = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className={cn("relative", className)}>
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
          "relative overflow-hidden border-2 border-dashed transition-colors",
          getAspectRatioClass(),
          dragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-primary/50"
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
                    e.stopPropagation();
                    openFileDialog();
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
                    e.stopPropagation();
                    startCamera();
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
                    e.stopPropagation();
                    handleRemove();
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
                <p className="text-sm text-muted-foreground mb-2">
                  Uploading...
                </p>
                {/* Progress Bar */}
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadProgress}%
                </p>
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
                      e.stopPropagation();
                      startCamera();
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
              {cameraError ? (
                <div className="space-y-4">
                  <div className="text-center p-8">
                    <p className="text-red-600 mb-4">{cameraError}</p>
                    <Button onClick={startCamera} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : capturedImage ? (
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
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      controls
                      muted
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => {
                        console.log("Video metadata loaded");
                      }}
                      onCanPlay={() => {
                        console.log("Video can play");
                        videoRef.current
                          ?.play()
                          .catch((err) =>
                            console.error("Autoplay blocked", err)
                          );
                      }}
                    />
                    {!cameraStream && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Starting camera...
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Please allow camera access
                          </p>
                        </div>
                      </div>
                    )}
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
                    {cameraStream
                      ? "Click the camera button to take a photo"
                      : "Starting camera... Please allow camera access when prompted"}
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
  );
}
