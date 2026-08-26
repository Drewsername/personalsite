// Phone cameras produce 4–8MB files. Shrinking them in the browser before
// upload keeps the upload fast on apartment wifi, keeps the data volume small,
// and means the server never needs an image library.

const MAX_EDGE = 1600;
const QUALITY = 0.82;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} could not be read as an image.`));
    };
    img.src = url;
  });
}

// Returns a JPEG data URL no larger than MAX_EDGE on its long side. Images
// already smaller than that are still re-encoded, which is what strips the
// camera's EXIF (including GPS coordinates) before anything leaves the device.
export async function resizeToDataUrl(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}
