import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ImagePlus } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  previewUrl: string | null;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageSelected, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
        e.dataTransfer.clearData();
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`prize-master-image-dropzone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
        backgroundColor: isDragging ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="プレビュー" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      ) : (
        <div id="addMasterPrizePlaceholder" style={{ pointerEvents: 'none' }}>
          <ImagePlus size={32} />
          <span>クリックまたは画像をドロップ</span>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="visually-hidden"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};
