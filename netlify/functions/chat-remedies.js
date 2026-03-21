// netlify/functions/chat-remedies.js
// Generates 3 remedy OPTIONS for a specific prediction/message
// User picks the one that resonates — "this OR that OR this"

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  try {
    const { prediction, intent, userName } = JSON.parse(event.body)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'AI not configured' }) }

    const prompt = `You are an expert Vedic astrologer. A user just received this prediction/advice:

"${prediction}"

Intent/topic: ${intent || 'general'}
User: ${userName || 'the seeker'}

Give exactly 3 remedy OPTIONS. Each should be a COMPLETE, STANDALONE remedy path —
so the user picks just ONE that feels right for them (not all three).

Make each option from a different system/approach so they feel meaningfully different:
- Option A: Quick, easy, beginner-friendly (mantra or simple ritual)
- Option B: Medium effort, material remedy (gemstone, yantra, donation)  
- Option C: Spiritual/devotional path (deity worship, fasting, pilgrimage)

Respond ONLY in this JSON:
{
  "context": "One sentence explaining why these remedies are for this specific prediction",
  "options": [
    {
      "id": "A",
      "label": "Quick Daily Practice",
      "icon": "🕉",
      "system": "Vedic",
      "difficulty": "Easy",
      "time": "5 min/day",
      "remedy": "Specific mantra or practice",
      "howto": "Exactly when, how, how many times",
      "benefit": "Specific benefit for THIS prediction",
      "duration": "40 days"
    },
    {
      "id": "B",
      "label": "Material Remedy",
      "icon": "💎",
      "system": "Lal Kitab",
      "difficulty": "Medium",
      "time": "One-time or weekly",
      "remedy": "Gemstone / yantra / specific donation",
      "howto": "How to obtain, activate, use",
      "benefit": "Specific benefit for THIS prediction",
      "duration": "Ongoing"
    },
    {
      "id": "C",
      "label": "Devotional Path",
      "icon": "🛕",
      "system": "Bhakti Vedic",
      "difficulty": "Moderate",
      "time": "Weekly",
      "remedy": "Deity worship, fasting, or puja",
      "howto": "Which temple or home puja, what to offer, which day",
      "benefit": "Specific benefit for THIS prediction",
      "duration": "3 months"
    }
  ]
}

Each remedy must be SPECIFIC to the prediction above. Not generic.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1200 }
        })
      }
    )
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    let result = {}
    try {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) result = JSON.parse(m[0])
    } catch { result = { error: 'Parse error' } }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
