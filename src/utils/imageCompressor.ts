/**
 * Mijoz qurilmasida rasmni siqish (Canvas yordamida).
 * 5-10 MB li kamera rasmini ~150-250 KB li WebP/JPEG ga aylantiradi.
 */
export async function compressImage(
  file: File | Blob,
  maxDimension = 1280,
  quality = 0.82,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        // Fallback to original if canvas not supported
        resolve(
          file instanceof File
            ? file
            : new File([file], 'photo.jpg', { type: file.type || 'image/jpeg' }),
        )
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(
              file instanceof File
                ? file
                : new File([file], 'photo.jpg', { type: 'image/jpeg' }),
            )
            return
          }
          const compressed = new File([blob], 'photo.webp', { type: 'image/webp' })
          resolve(compressed)
        },
        'image/webp',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Rasmni o'qib bo'lmadi"))
    }

    img.src = url
  })
}
