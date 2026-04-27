import React, { useEffect, useRef } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

interface ImageCropperModalProps {
  imageUrl: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageUrl, onConfirm, onCancel }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);

  useEffect(() => {
    if (imageRef.current) {
      cropperRef.current = new Cropper(imageRef.current, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        autoCropArea: 1,
      } as any);
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
    };
  }, [imageUrl]);

  const handleConfirm = () => {
    if (cropperRef.current) {
      cropperRef.current.getCroppedCanvas({ width: 300, height: 300, imageSmoothingQuality: 'high' }).toBlob((blob: Blob | null) => {
        if (blob) {
          const file = new File([blob], 'processed_image.png', { type: 'image/png' });
          onConfirm(file);
        } else {
          onCancel();
        }
      }, 'image/png');
    }
  };

  return (
    <div className="modal" style={{ display: 'block', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <span className="close-button" onClick={onCancel}>×</span>
        <h3>画像のトリミング</h3>
        <div className="cropper-container" style={{ width: '100%', maxHeight: '60vh', overflow: 'hidden', marginBottom: '20px' }}>
          <img ref={imageRef} src={imageUrl} alt="crop target" style={{ maxWidth: '100%' }} />
        </div>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="primary-action" onClick={handleConfirm}>確定</button>
        </div>
      </div>
    </div>
  );
};
