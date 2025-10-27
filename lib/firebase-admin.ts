import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
let adminApp
let adminDb

// Initialize Firebase Admin in all environments
if (true) {
  try {
    // Try to use service account credentials if available
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Using Firebase service account credentials')
      adminApp = getApps().length === 0 
        ? initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID || "nhsf-test",
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
          })
        : getApps()[0]
    } else {
      console.log('Using default Firebase credentials')
      // Use default credentials (for local development with Firebase CLI)
      adminApp = getApps().length === 0 
        ? initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || "nhsf-test"
          })
        : getApps()[0]
    }
    
    adminDb = getFirestore(adminApp)
    console.log('Firebase Admin initialized successfully')
    
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    // Fallback to default project
    try {
      adminApp = getApps().length === 0 
        ? initializeApp({
            projectId: "nhsf-test"
          })
        : getApps()[0]
      adminDb = getFirestore(adminApp)
      console.log('Firebase Admin fallback initialization successful')
    } catch (fallbackError) {
      console.error('Firebase Admin fallback initialization failed:', fallbackError)
      adminDb = null
    }
  }
} else {
  console.log('Skipping Firebase Admin initialization during build')
}

export { adminDb }
export default adminApp
