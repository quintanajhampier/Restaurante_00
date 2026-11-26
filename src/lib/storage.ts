import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

function validateFile(file: File): void {
  const type = file.type.toLowerCase()
  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('El archivo supera el límite de 5 MB.')
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  validateFile(file)
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`
  const storageRef = ref(storage, `products/${filename}`)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}

export async function uploadPaymentProof(file: File): Promise<string> {
  validateFile(file)
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`
  const storageRef = ref(storage, `payment_proofs/${filename}`)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url))
  } catch {
    // ignore — URL may no longer exist
  }
}
