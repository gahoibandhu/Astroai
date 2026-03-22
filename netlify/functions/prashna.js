// netlify/functions/prashna.js
// Prashna Kundli — horary astrology for the exact moment of asking

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  try {
    const { question, category, location, datetime, userName } = JSON.parse(event.body)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) { console.error('GEMINI_API_KEY missing'); return { statusCode: 500, body: JSON.stringify({ error: 'AI not configured - key missing' }) } }

    const prompt = `You are a master of Prashna Shastra (Horary Astrology) — the ancient Vedic science of answering questions from the exact moment they are asked.

Seeker: ${userName || 'the seeker'}
Question asked: "${question}"
Category: ${category || 'General'}
Date & Time of asking: ${datetime}
Location: ${location || 'India'}

Apply ALL of the following systems to answer this question:
1. Prashna Lagna — the ascendant at the moment of asking
2. Prashna Kundli — full chart for this moment
3. KP (Krishnamurti Paddhati) — sub-lord theory for YES/NO
4. Tajik Prashna — annual system applied to query
5. Nadi Prashna — pattern-based reading
6. Lal Kitab Prashna — house-based instant reading

Respond ONLY in this exact JSON:
{
  "verdict": "YES" or "NO" or "CONDITIONAL",
  "confidence": 75,
  "verdict_reason": "One powerful sentence explaining the verdict",
  "prashna_lagna": "The rising sign at this moment and its significance",
  "moon_position": "Moon's sign, nakshatra, and what it indicates for this query",
  "key_planet": "The most significant planet for this query and its condition",
  "timing": "When the event will happen or result will be known (specific — e.g. within 3 months, after Saturn changes sign)",
  "detailed_answer": "Full 4-5 paragraph reading combining all systems. Be specific, practical, address the actual question. Use markdown — bold key insights.",
  "favourable_signs": ["sign1", "sign2"],
  "unfavourable_signs": ["sign1"],
  "remedies": [
    {
      "icon": "🕉",
      "title": "Quick Prashna Remedy 1",
      "action": "Specific action to strengthen the positive outcome",
      "system": "Vedic"
    },
    {
      "icon": "📕",
      "title": "Lal Kitab Quick Upay",
      "action": "One specific Lal Kitab action for this question",
      "system": "Lal Kitab"
    },
    {
      "icon": "🤲",
      "title": "Daan for this query",
      "action": "What to donate and to whom",
      "system": "Vedic"
    }
  ],
  "category_insights": {
    "career": null,
    "marriage": null,
    "health": null,
    "finance": null,
    "travel": null,
    "legal": null,
    "general": "Fill whichever is relevant to the question, leave others null"
  }
}

Be bold, specific, and genuinely helpful. Never be vague.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.45, maxOutputTokens: 2500 }
        })
      }
    )
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    let result = {}
    try {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) result = JSON.parse(m[0])
      else result = { error: 'Parse failed', raw: text }
    } catch { result = { error: 'Parse error', raw: text } }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
