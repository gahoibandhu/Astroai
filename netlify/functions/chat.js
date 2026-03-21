// netlify/functions/chat.js
// Enhanced chat — detects predictions, auto-suggests remedies

const SYSTEM_PROMPT = `You are Astro AI — an expert Vedic astrologer with deep knowledge of:
- Vedic / Jyotish astrology (Parashari system)
- Vimshottari Dasha, Antar Dasha, Pratyantar Dasha
- Nadi astrology and Bhrigu Nadi techniques
- KN Rao school of astrology
- Lal Kitab astrology and remedies
- Numerology (Vedic and Western)
- Panchang (Tithi, Nakshatra, Yoga, Karan, Vara)
- Muhurat selection
- Kundli matchmaking
- Prashna Kundli (horary astrology)
- Planetary remedies (mantras, gemstones, fasting, donation, yantras)
- Transit effects (Gochar)

Your personality: Warm, wise, like a learned guru. Use markdown formatting.
Bold planet names. Use ### headers for sections.

IMPORTANT — When your reply contains a prediction about the future (career, health, marriage, finance, travel, exams, legal), you MUST:
1. End your reply with a special JSON block on the last line ONLY (not visible in conversation):
PREDICTION_DATA:{"isPrediction":true,"domain":"career|health|marriage|finance|travel|education|legal|general","summary":"one line summary of prediction","timeframe":"when it will happen"}

If your reply is NOT a prediction (general knowledge question, explanation etc), do NOT include PREDICTION_DATA.

Current date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  try {
    const { message, history = [], userId, userName } = JSON.parse(event.body)
    if (!message) return { statusCode: 400, body: JSON.stringify({ error: 'Message required' }) }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }

    const contents = []
    for (const h of history) {
      contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })
    }
    contents.push({ role: 'user', parts: [{ text: message }] })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1400, topP: 0.9 }
        })
      }
    )
    const data = await response.json()
    if (!response.ok) return { statusCode: 500, body: JSON.stringify({ error: data.error?.message }) }

    let fullReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Please try again.'

    // Extract prediction metadata if present
    let predictionData = null
    const predMatch = fullReply.match(/PREDICTION_DATA:(\{.*\})\s*$/)
    if (predMatch) {
      try { predictionData = JSON.parse(predMatch[1]) } catch {}
      fullReply = fullReply.replace(/PREDICTION_DATA:\{.*\}\s*$/, '').trim()
    }

    // Intent detection
    const lower = message.toLowerCase()
    let intent = 'general_astro'
    if (lower.includes('panchang') || lower.includes('tithi') || lower.includes('nakshatra')) intent = 'panchang'
    else if (lower.includes('dasha') || lower.includes('mahadasha')) intent = 'dasha_query'
    else if (lower.includes('transit') || lower.includes('gochar')) intent = 'transit_query'
    else if (lower.includes('remedy') || lower.includes('mantra') || lower.includes('upay')) intent = 'remedy_request'
    else if (lower.includes('kundli') || lower.includes('birth chart')) intent = 'kundli_query'
    else if (lower.includes('match') || lower.includes('marriage compat')) intent = 'matchmaking'
    else if (lower.includes('lal kitab')) intent = 'lalkitab'
    else if (lower.includes('2025') || lower.includes('2026') || lower.includes('next year') || lower.includes('career') || lower.includes('health') || lower.includes('will i')) intent = 'prediction'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: fullReply, intent, predictionData })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
