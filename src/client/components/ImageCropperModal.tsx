import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

interface ImageCropperModalProps {
  imageUrl: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = 300;
  resizedCanvas.height = 300;
  const resizedCtx = resizedCanvas.getContext('2d');
  if (resizedCtx) {
    resizedCtx.imageSmoothingQuality = 'high';
    resizedCtx.drawImage(canvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, 300, 300);
  }

  return new Promise((resolve) => {
    (resizedCtx ? resizedCanvas : canvas).toBlob((file) => {
      resolve(file);
    }, 'image/png');
  });
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageUrl, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (croppedAreaPixels) {
      try {
        const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
        if (blob) {
          const file = new File([blob], 'processed_image.png', { type: 'image/png' });
          onConfirm(file);
        } else {
          onCancel();
        }
      } catch (e) {
        console.error(e);
        onCancel();
      }
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content max-w-400 flex-column">
        <span className="close-button" onClick={onCancel}>×</span>
        <h3>画像のトリミング</h3>
        <div className="cropper-wrapper">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className="modal-actions mt-auto">
          <button className="primary-action" onClick={handleConfirm}>確定</button>
        </div>
      </div>
    </div>
  );
};
