/**
 * Client-side media preparation.
 *
 * Large phone photos (8–15 MB) dominate upload time on field connections, so we
 * downscale and re-encode them in the browser before touching storage. Videos
 * are left untouched (transcoding in the browser is slower than uploading) but
 * every attachment is uploaded in parallel instead of one after another.
 */

const MAX_IMAGE_EDGE = 1920;
const IMAGE_QUALITY = 0.72;
const COMPRESS_ABOVE_BYTES = 400 * 1024;

function canCompress(file: File): boolean {
  return (
    typeof document !== "undefined" &&
    file.type.startsWith("image/") &&
    !file.type.includes("gif") &&
    !file.type.includes("svg") &&
    file.size > COMPRESS_ABOVE_BYTES
  );
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image decode failed"));
      image.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** Returns a smaller image file when worthwhile, otherwise the original file. */
export async function compressImageFile(file: File): Promise<File> {
  if (!canCompress(file)) return file;
  try {
    const bitmap = await loadBitmap(file);
    const width = "width" in bitmap ? bitmap.width : 0;
    const height = "height" in bitmap ? bitmap.height : 0;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap as CanvasImageSource, 0, 0, targetWidth, targetHeight);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Prepares every picked file concurrently. */
export async function prepareFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file)));
}
