'use client';

import { useState, useRef } from 'react';
import { Pencil, Upload, Crop, Trash2 } from 'lucide-react';
import { ImageCropper } from '@/components/ui/image-cropper';
import { uploadFile } from '@/lib/upload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface EditableImageProps {
  src: string | null;
  alt?: string;
  onImageChange: (url: string | null) => void;
  shape?: 'circle' | 'square';
  bucket?: string;
  className?: string;
  placeholderText?: string;
}

export function EditableImage({
  src,
  alt = '',
  onImageChange,
  shape = 'square',
  bucket = 'logos',
  className = '',
  placeholderText = '?',
}: EditableImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const cropShape = shape === 'circle' ? 'round' as const : 'rect' as const;
  const aspect = shape === 'circle' ? 1 : undefined;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    setUploading(true);
    try {
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const url = await uploadFile(file, bucket);
      if (url) onImageChange(url);
    } finally {
      setUploading(false);
    }
  };

  const handleCropExisting = () => {
    if (src) {
      setCropperImage(src);
      setCropperOpen(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={`relative group cursor-pointer ${className}`}>
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
              />
            ) : (
              <div className={`w-full h-full bg-[#e7eef1] flex items-center justify-center text-[#6b7280] text-sm font-semibold ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}>
                {placeholderText}
              </div>
            )}
            <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}>
              {uploading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Pencil size={20} className="text-white" />
              )}
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" sideOffset={8}>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Neues Bild hochladen
          </DropdownMenuItem>
          {src && (
            <DropdownMenuItem onClick={handleCropExisting}>
              <Crop className="h-4 w-4 mr-2" />
              Zuschneiden
            </DropdownMenuItem>
          )}
          {src && (
            <DropdownMenuItem
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Bild entfernen
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <ImageCropper
        imageSrc={cropperImage}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
        cropShape={cropShape}
        aspect={aspect}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => onImageChange(null)}
        title="Bild entfernen?"
        description="Das Bild wird entfernt. Sie können jederzeit ein neues Bild hochladen."
        confirmText="Entfernen"
        variant="destructive"
      />
    </>
  );
}
