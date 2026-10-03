/**
 * Read an image file as a data URL, downscaled so deck JSON stays small.
 * Long edge capped at 1600px, re-encoded as WebP (fallback to original).
 * Shared by the inspector upload and the editor-canvas drag & drop.
 */
export async function fileToDeckImage(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) {
    throw new Error('Use a PNG, JPG, WebP or GIF image.');
  }
  if (file.size > 8_000_000) throw new Error('Image must be under 8 MB.');
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode the image.'));
      el.src = raw;
    });
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    if (scale >= 1 && raw.length < 900_000) return raw; // already small
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.85);
  } catch {
    return raw; // decode unsupported in this browser — keep original
  }
}
