export interface CompressOptions {
  maxWidth?: number
  quality?: number
}

export function compressImage(file: File | Blob, options: CompressOptions = {}): Promise<Blob> {
  const { maxWidth = 1920, quality = 0.7 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No se pudo obtener el contexto 2D')); return }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Falló la compresión de la imagen'))
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar la imagen')) }
    img.src = url
  })
}

export function photoFileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function revokePreviewUrls(urls: string[]) {
  urls.forEach((url) => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
  })
}
