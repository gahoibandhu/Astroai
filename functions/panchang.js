// netlify/functions/panchang.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  try {
    const { location, date } = JSON.parse(event.body)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) { console.error('GEMINI_API_KEY missing'); return { statusCode: 500, body: JSON.stringify({ error: 'AI not configured - key missing' }) } }

    const dateObj = new Date(date)
    const weekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()]
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    const prompt = `You are an expert Vedic astrologer and panchang calculator.

Generate today's panchang for:
Location: ${location}
Date: ${dateStr} (${weekday})

Respond ONLY with this JSON (no other text):
{
  "tithi": "e.g. Shukla Paksha Tritiya (3rd day of waxing moon)",
  "nakshatra": "e.g. Rohini (until 3:45 PM)",
  "yoga": "e.g. Siddha Yoga",
  "karan": "e.g. Bava",
  "sunrise": "e.g. 6:12 AM",
  "sunset": "e.g. 6:48 PM",
  "rahukaal": "e.g. 9:00 AM to 10:30 AM",
  "abhijitMuhurat": "e.g. 11:54 AM to 12:48 PM",
  "vara": "${weekday}",
  "guidance": "A 2-3 sentence cosmic guidance for this day based on the tithi, nakshatra, and planetary positions. What is this day good for? What to avoid? Keep it practical and warm."
}

Use actual astronomical calculations for ${dateStr}. Be accurate with tithi and nakshatra.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
        })
      }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let result = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) result = JSON.parse(jsonMatch[0])
    } catch (e) {
      result = { error: 'Could not parse panchang', raw: text }
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    console.error('panchang error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
