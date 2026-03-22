// src/utils/googleAuth.js
// Pure Google OAuth — no Firebase Auth. Just Google Identity Services.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    document.head.appendChild(script)
  })
}

function decodeJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
    return JSON.parse(json)
  } catch { return null }
}

export function getSavedUser() {
  try {
    const raw = localStorage.getItem('astroai_user')
    if (!raw) return null
    const user = JSON.parse(raw)
    // Session valid 7 days
    if (Date.now() - user.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('astroai_user')
      return null
    }
    return user
  } catch { return null }
}

export async function signInWithGoogle() {
  await loadGoogleScript()
  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        if (response.error) { reject(new Error(response.error)); return }
        const payload = decodeJWT(response.credential)
        if (!payload) { reject(new Error('Invalid token')); return }
        const user = {
          uid: payload.sub,
          email: payload.email,
          name: payload.name,
          photoURL: payload.picture,
          savedAt: Date.now()
        }
        localStorage.setItem('astroai_user', JSON.stringify(user))
        resolve(user)
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const container = document.getElementById('google-signin-container')
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline', size: 'large',
            text: 'continue_with', width: 280,
          })
        }
      }
    })
  })
}

export function signOutUser() {
  localStorage.removeItem('astroai_user')
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect()
  }
}
