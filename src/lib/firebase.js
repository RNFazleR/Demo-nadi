// Konfigurasi Firebase dari .env.local (lihat .env.example). Konfigurasi web Firebase bukan rahasia,
// tetapi tetap tidak di-commit supaya tiap pengembang memakai project-nya sendiri.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)
