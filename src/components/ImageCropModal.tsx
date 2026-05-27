"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
  cropShape?: "round" | "rect";
}

// Utility: canvas crop
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0,
  cropShape: "round" | "rect" = "rect",
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const radians = (rotation * Math.PI) / 180;

  // Calculate bounding box of the rotated image
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  // Set canvas size to bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Now extract the cropped area
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d")!;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  if (cropShape === "round") {
    croppedCtx.beginPath();
    croppedCtx.arc(
      pixelCrop.width / 2,
      pixelCrop.height / 2,
      Math.min(pixelCrop.width, pixelCrop.height) / 2,
      0,
      2 * Math.PI,
    );
    croppedCtx.closePath();
    croppedCtx.clip();
  }

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas crop failed"));
      },
      cropShape === "round" ? "image/png" : "image/jpeg",
      0.92,
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "round",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        cropShape,
      );
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error("Crop error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flexcc">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90vw] max-w-lg bg-primary border border-border-divider rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-16 px-5 bg-secondary/50 border-b border-border-divider flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-white">Crop Foto</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-elevated rounded-xl transall"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full aspect-square bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                cropShape={cropShape}
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                classes={{
                  containerClassName: "!bg-black",
                }}
              />
            </div>

            {/* Controls */}
            <div className="p-4 bg-secondary/30 border-t border-border-divider space-y-3">
              {/* Zoom */}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-text-muted shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-accent-default h-1.5 cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-text-muted shrink-0" />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-secondary hover:text-white hover:bg-elevated rounded-xl transall"
                >
                  <RotateCw className="w-4 h-4" />
                  Putar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-white hover:bg-elevated rounded-xl transall"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-accent-default hover:bg-accent-hover text-text-on-accent text-xs font-black rounded-xl transall flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
