import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Detect placeholder or missing config
const isConfigured =
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('PLACEHOLDER')

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

if (isConfigured) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
} else {
    // Stub mode — app renders but Firestore calls are no-ops
    console.warn(
        '[EventSaaS] Firebase not configured. Update VITE_FIREBASE_* in .env\n' +
        'Get your config from: Firebase Console → Project Settings → Your Apps'
    )
    // Initialize with placeholder (will error on auth calls, but app renders)
    app = initializeApp({ ...firebaseConfig, apiKey: 'placeholder-key-for-dev' }, 'eventsaas-dev')
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
}

export { auth, db, storage }
export default app
