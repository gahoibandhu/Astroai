// netlify/functions/chat.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { message, history = [] } = JSON.parse(event.body || '{}')
    if (!message) return { statusCode: 400, body: JSON.stringify({ error: 'Message required' }) }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key missing' }) }
    }

    const SYSTEM = `You are Astro AI — an expert Vedic astrologer. Answer astrology questions with detail and warmth. Use **bold** for planet names. Current date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

    const contents = []
    for (const h of history.slice(-6)) {
      contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })
    }
    contents.push({ role: 'user', parts: [{ text: message }] })

    // Try all available model names
    const models = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-latest',
      'gemini-2.0-flash-001',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro'
    ]

    let reply = null
    let lastError = null

    for (const model of models) {
      try {
        console.log('Trying model:', model)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM }] },
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
            })
          }
        )
        const data = await res.json()
        console.log('Status:', res.status, 'for model:', model)
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text
          console.log('SUCCESS with model:', model)
          break
        } else {
          lastError = data.error?.message || 'Unknown error'
          console.log('Failed:', model, '-', lastError?.slice(0, 100))
        }
      } catch (e) {
        lastError = e.message
        console.log('Fetch error:', model, e.message)
      }
    }

    if (!reply) {
      // Last resort - try v1 API instead of v1beta
      try {
        console.log('Trying v1 API...')
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1000 } })
          }
        )
        const data = await res.json()
        console.log('v1 status:', res.status)
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text
          console.log('SUCCESS with v1 API')
        } else {
          lastError = data.error?.message
          console.log('v1 also failed:', lastError?.slice(0, 100))
        }
      } catch(e) {
        console.log('v1 fetch error:', e.message)
      }
    }

    if (!reply) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI unavailable', details: lastError }) }
    }

    const lower = message.toLowerCase()
    let intent = 'general_astro'
    if (lower.includes('dasha') || lower.includes('mahadasha')) intent = 'dasha_query'
    else if (lower.includes('transit') || lower.includes('gochar')) intent = 'transit_query'
    else if (lower.includes('remedy') || lower.includes('mantra')) intent = 'remedy_request'
    else if (lower.includes('kundli') || lower.includes('birth chart')) intent = 'kundli_query'
    else if (lower.includes('panchang') || lower.includes('tithi')) intent = 'panchang'
    else if (lower.includes('match') || lower.includes('marriage')) intent = 'matchmaking'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply, intent })
    }

  } catch (err) {
    console.error('Chat error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
