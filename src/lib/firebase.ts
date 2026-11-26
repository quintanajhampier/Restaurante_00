import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBH_ffqzlTDtPZod8iJFQhPilvPyAzdr1M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '://firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'restaurante-00',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'restaurante-00.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '907617370680',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:907617370680:web:a8ff199192523cb7e81ccd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-2DBNGV87S3',
}

export const firebaseInitError: string | null = (() => {
  const missing: string[] = []
  if (!firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY')
  if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID')
  if (!firebaseConfig.appId) missing.push('VITE_FIREBASE_APP_ID')
  if (missing.length > 0) {
    return `Falta configurar en .env: ${missing.join(', ')}`
  }
  return null
})()

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

if (!firebaseInitError) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Firebase no pudo inicializar: ${msg}`)
  }
}

export { app, auth, db, storage }
