// netlify/functions/admin-stats.js
// Uses Firestore REST API — no firebase-admin, no billing required

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { secret, action } = JSON.parse(event.body)
    if (secret !== process.env.ADMIN_SECRET) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const projectId = process.env.VITE_FIREBASE_PROJECT_ID
    const apiKey    = process.env.VITE_FIREBASE_API_KEY
    const base      = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

    // Helper: fetch a Firestore collection via REST
    async function getCollection(col) {
      const url = `${base}/${col}?key=${apiKey}&pageSize=300`
      const res = await fetch(url)
      const data = await res.json()
      if (!data.documents) return []
      return data.documents.map(doc => {
        const fields = doc.fields || {}
        const out = { id: doc.name.split('/').pop() }
        for (const [k, v] of Object.entries(fields)) {
          out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.timestampValue ?? v.doubleValue ?? null
        }
        return out
      })
    }

    if (action === 'overview') {
      const [preds, users] = await Promise.all([
        getCollection('predictions'),
        getCollection('users')
      ])

      const tested  = preds.filter(p => p.tested === true || p.tested === 'true')
      const correct = tested.filter(p => p.verdict === 'correct')
      const partial = tested.filter(p => p.verdict === 'partial')
      const wrong   = tested.filter(p => p.verdict === 'wrong')

      const overallAccuracy = tested.length > 0
        ? Math.round((correct.length + partial.length * 0.5) / tested.length * 100)
        : 0

      // Group by intent
      const byIntent = {}
      tested.forEach(p => {
        const k = p.intent || 'general'
        if (!byIntent[k]) byIntent[k] = { correct:0, partial:0, wrong:0, total:0, ratings:[] }
        byIntent[k].total++
        if (p.verdict) byIntent[k][p.verdict] = (byIntent[k][p.verdict] || 0) + 1
        if (p.rating)  byIntent[k].ratings.push(Number(p.rating))
      })

      const intentStats = Object.entries(byIntent).map(([intent, s]) => ({
        intent,
        total:    s.total,
        correct:  s.correct || 0,
        partial:  s.partial || 0,
        wrong:    s.wrong   || 0,
        accuracy: s.total > 0 ? Math.round(((s.correct||0) + (s.partial||0)*0.5) / s.total * 100) : 0,
        avgRating: s.ratings.length ? (s.ratings.reduce((a,b)=>a+b,0)/s.ratings.length).toFixed(1) : null
      })).sort((a,b) => b.accuracy - a.accuracy)

      const topWrong = preds
        .filter(p => p.verdict === 'wrong')
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          intent: p.intent,
          prediction: (p.predictionText || '').slice(0, 120),
          userNote: p.userNote || '',
          rating: Number(p.rating) || 0
        }))

      const recentUsers = users.slice(0, 20).map(u => ({
        name:       u.name       || '',
        email:      u.email      || '',
        loginCount: u.loginCount || 0,
        lastSeen:   u.lastSeen   ? new Date(u.lastSeen).toLocaleDateString('en-IN') : ''
      }))

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totals: {
            predictions:     preds.length,
            tested:          tested.length,
            registeredUsers: users.length,
            correct:         correct.length,
            partial:         partial.length,
            wrong:           wrong.length,
            overallAccuracy
          },
          intentStats,
          topWrong,
          recentUsers
        })
      }
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) }
  } catch (err) {
    console.error('admin-stats error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
