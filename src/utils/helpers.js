export const APP_VERSION = '0.91.15';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const daysFromNow = (n) => Date.now() + n * 86400000;

export function shuffleArr(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function resizeImageFile(file, maxDim = 480, quality = 0.72) {
  return fileToDataUrl(file).then(
    (dataUrl) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
      })
  );
}