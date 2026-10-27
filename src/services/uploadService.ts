import { API_URL, API_ENABLED } from '../config/env'
import { isServerOnline } from './serverHealth'
import { authHeaders } from './authHeaders'

/**
 * Rasmni serverga yuklash (POST /api/v1/upload)
 * Muvaffaqiyatli bo'lsa serverdagi URL qaytadi, masalan: "/uploads/abc12345.webp"
 */
export async function uploadPhoto(file: File | Blob): Promise<string | null> {
  if (!API_ENABLED || !isServerOnline()) return null

  try {
    const formData = new FormData()
    formData.append('image', file, file instanceof File ? file.name : 'photo.webp')

    const base = API_URL || ''
    const headers = authHeaders() as Record<string, string>
    // Delete Content-Type so browser sets multipart boundary automatically
    delete headers['Content-Type']

    const res = await fetch(`${base}/api/v1/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!res.ok) {
      console.warn('[bindy] upload photo failed:', res.status)
      return null
    }

    const data = (await res.json()) as { ok: boolean; url: string }
    return data.ok && data.url ? data.url : null
  } catch (err) {
    console.warn('[bindy] upload photo error:', err)
    return null
  }
}
