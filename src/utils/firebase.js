// src/utils/firebase.js
// Firebase is used ONLY for Firestore database — NOT for auth.
// Auth is handled separately via Google OAuth directly.

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection, doc, setDoc, addDoc, getDoc, getDocs,
  query, where, orderBy, limit, serverTimestamp, updateDoc, increment
} from 'firebase/firestore'

// Get these from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ─────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────

// Create or update user record on every login
export async function upsertUser({ uid, email, name, photoURL }) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, {
      name, photoURL, email,
      lastSeen: serverTimestamp(),
      loginCount: increment(1)
    })
  } else {
    await setDoc(ref, {
      uid, email, name, photoURL,
      firstSeen: serverTimestamp(),
      lastSeen: serverTimestamp(),
      loginCount: 1,
      plan: 'free'
    })
  }
}

// ─────────────────────────────────────────────
//  CHAT HISTORY
// ─────────────────────────────────────────────

// Save one chat exchange (user message + AI reply)
export async function saveChatMessage({ uid, sessionId, userMessage, aiReply, intent }) {
  await addDoc(collection(db, 'chat_history'), {
    uid,
    sessionId,
    userMessage,
    aiReply,
    intent: intent || 'general',
    createdAt: serverTimestamp()
  })
}

// Load last 30 messages for a user (across all sessions)
export async function loadChatHistory(uid) {
  const q = query(
    collection(db, 'chat_history'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()
}

// ─────────────────────────────────────────────
//  KUNDLI
// ─────────────────────────────────────────────

// Save a generated kundli
export async function saveKundli({ uid, name, dob, tob, pob, chartData }) {
  const ref = await addDoc(collection(db, 'kundli'), {
    uid, name, dob, tob, pob,
    chartData,
    createdAt: serverTimestamp()
  })
  return ref.id
}

// Get all kundlis for a user
export async function getUserKundlis(uid) {
  const q = query(
    collection(db, 'kundli'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─────────────────────────────────────────────
//  PANCHANG CACHE
// ─────────────────────────────────────────────

// Cache panchang so same date+location isn't fetched twice
export async function getCachedPanchang(cacheKey) {
  const ref = doc(db, 'panchang_cache', cacheKey)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  // Cache valid for 12 hours
  const age = Date.now() - data.savedAt?.toMillis?.()
  if (age > 12 * 60 * 60 * 1000) return null
  return data.panchang
}

export async function cachePanchang(cacheKey, panchang) {
  await setDoc(doc(db, 'panchang_cache', cacheKey), {
    panchang,
    savedAt: serverTimestamp()
  })
}

// ─────────────────────────────────────────────
//  RAM SHALAKA LOG
// ─────────────────────────────────────────────

export async function saveRamShalakaReading({ uid, question, selectedChars, answer }) {
  await addDoc(collection(db, 'ramshalaka_log'), {
    uid, question, selectedChars, answer,
    createdAt: serverTimestamp()
  })
}

// ─────────────────────────────────────────────
//  FEEDBACK / PREDICTIONS
// ─────────────────────────────────────────────

export async function saveFeedback({ uid, chatId, rating, comment }) {
  await addDoc(collection(db, 'feedback'), {
    uid, chatId, rating, comment,
    createdAt: serverTimestamp()
  })
}

// ─────────────────────────────────────────────
//  REMEDIES
// ─────────────────────────────────────────────

export async function saveRemedy({ uid, query, queryType, remedyData }) {
  const ref = await addDoc(collection(db, 'remedies'), {
    uid,
    query,
    queryType,  // 'planet' or 'problem'
    remedyData,
    createdAt: serverTimestamp()
  })
  return ref.id
}

export async function getUserRemedies(uid) {
  const q = query(
    collection(db, 'remedies'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─────────────────────────────────────────────
//  PRASHNA KUNDLI
// ─────────────────────────────────────────────
export async function savePrashna({ uid, question, topic, location, result }) {
  const ref = await addDoc(collection(db, 'prashna'), {
    uid, question, topic, location,
    result, createdAt: serverTimestamp()
  })
  return ref.id
}

export async function getUserPrashnas(uid) {
  const q = query(
    collection(db, 'prashna'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─────────────────────────────────────────────
//  PREDICTIONS + FEEDBACK (self-learning)
// ─────────────────────────────────────────────
export async function savePrediction({ uid, chatId, sessionId, predictionText, intent, engine }) {
  const ref = await addDoc(collection(db, 'predictions'), {
    uid, chatId, sessionId,
    predictionText, intent,
    engine: engine || 'gemini',
    rating: null, verdict: null, userNote: '',
    tested: false,
    createdAt: serverTimestamp()
  })
  return ref.id
}

export async function getUserPredictions(uid) {
  const q = query(
    collection(db, 'predictions'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function submitPredictionFeedback({ predictionId, rating, verdict, userNote }) {
  const ref = doc(db, 'predictions', predictionId)
  await updateDoc(ref, {
    rating, verdict, userNote,
    tested: true,
    feedbackAt: serverTimestamp()
  })
}

export async function getPredictionStats(uid) {
  const preds = await getUserPredictions(uid)
  const tested = preds.filter(p => p.tested)
  const correct = tested.filter(p => p.verdict === 'correct').length
  const partial = tested.filter(p => p.verdict === 'partial').length
  const wrong = tested.filter(p => p.verdict === 'wrong').length
  const avgRating = tested.length > 0
    ? (tested.reduce((s, p) => s + (p.rating || 0), 0) / tested.length).toFixed(1)
    : null
  return { total: preds.length, tested: tested.length, correct, partial, wrong, avgRating, accuracy: tested.length > 0 ? Math.round((correct + partial * 0.5) / tested.length * 100) : null }
}


// ─────────────────────────────────────────────
//  ADMIN (read-only from frontend — write via function)
// ─────────────────────────────────────────────
export async function getAllPredictionsAdmin() {
  return []
}

// Alias for backward compatibility
export async function getAccuracyStats(uid) {
  return getPredictionStats(uid)
}
