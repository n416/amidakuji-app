let currentResolve = null;
let cropper = null;
let listenersAttached = false;

function getElements() {
  return {
    cropperModal: document.getElementById('imageCropperModal'),
    cropperImage: document.getElementById('cropperImage'),
    confirmCropButton: document.getElementById('confirmCropButton'),
    cancelCropButton: document.getElementById('cancelCropButton'),
  };
}

function attachListenersIfNeeded() {
  if (listenersAttached) return;
  const elements = getElements();
  if (!elements.confirmCropButton || !elements.cancelCropButton) return;

  elements.confirmCropButton.addEventListener('click', () => {
    if (cropper && currentResolve) {
      cropper.getCroppedCanvas({width: 300, height: 300, imageSmoothingQuality: 'high'}).toBlob((blob) => {
        currentResolve(new File([blob], 'processed_image.png', {type: 'image/png'}));
        hideCropper();
      }, 'image/png');
    }
  });

  elements.cancelCropButton.addEventListener('click', () => {
    if (currentResolve) currentResolve(null); // キャンセル時はnullを返す
    hideCropper();
  });

  listenersAttached = true;
}

function showCropper(imageUrl) {
  const elements = getElements();
  if (!elements.cropperImage || !elements.cropperModal) {
    console.error('Cropper elements not found in DOM');
    if (currentResolve) currentResolve(null);
    return;
  }
  
  attachListenersIfNeeded();
  
  elements.cropperImage.src = imageUrl;
  elements.cropperModal.style.display = 'block';
  
  if (cropper) cropper.destroy();
  // @ts-ignore
  cropper = new Cropper(elements.cropperImage, {
    aspectRatio: 1,
    viewMode: 1,
    background: false,
    autoCropArea: 1,
  });
}

function hideCropper() {
  const elements = getElements();
  if (cropper) cropper.destroy();
  cropper = null;
  if (elements.cropperModal) {
    elements.cropperModal.style.display = 'none';
  }
}

export function processImage(file) {
  return new Promise((resolve) => {
    currentResolve = resolve;
    const reader = new FileReader();
    reader.onload = (e) => showCropper(e.target.result);
    reader.readAsDataURL(file);
  });
}
