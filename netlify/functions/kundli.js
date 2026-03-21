// netlify/functions/kundli.js
// Generates kundli analysis using Gemini AI
// Note: For real planet positions, you would integrate a paid ephemeris API.
// This version gives AI-based analysis from birth details.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { name, dob, tob, pob, userId, userName } = JSON.parse(event.body)

    if (!name || !dob || !tob || !pob) {
      return { statusCode: 400, body: JSON.stringify({ error: 'All fields required' }) }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }

    // Calculate sun sign from DOB for the planet table
    const dobDate = new Date(dob)
    const month = dobDate.getMonth() + 1
    const day = dobDate.getDate()

    // Approximate Vedic sun sign (sidereal, ~23 days behind tropical)
    const getSunSign = (m, d) => {
      if ((m === 4 && d >= 14) || (m === 5 && d <= 14)) return 'Mesha (Aries)'
      if ((m === 5 && d >= 15) || (m === 6 && d <= 14)) return 'Vrishabha (Taurus)'
      if ((m === 6 && d >= 15) || (m === 7 && d <= 15)) return 'Mithuna (Gemini)'
      if ((m === 7 && d >= 16) || (m === 8 && d <= 16)) return 'Karka (Cancer)'
      if ((m === 8 && d >= 17) || (m === 9 && d <= 16)) return 'Simha (Leo)'
      if ((m === 9 && d >= 17) || (m === 10 && d <= 16)) return 'Kanya (Virgo)'
      if ((m === 10 && d >= 17) || (m === 11 && d <= 15)) return 'Tula (Libra)'
      if ((m === 11 && d >= 16) || (m === 12 && d <= 15)) return 'Vrishchika (Scorpio)'
      if ((m === 12 && d >= 16) || (m === 1 && d <= 13)) return 'Dhanu (Sagittarius)'
      if ((m === 1 && d >= 14) || (m === 2 && d <= 12)) return 'Makara (Capricorn)'
      if ((m === 2 && d >= 13) || (m === 3 && d <= 13)) return 'Kumbha (Aquarius)'
      return 'Meena (Pisces)'
    }

    const sunSign = getSunSign(month, day)
    const birthYear = dobDate.getFullYear()
    const birthHour = parseInt(tob.split(':')[0])

    // Rough lagna estimate (ascendant changes every 2 hours)
    const lagnas = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena']
    const lagnaIndex = Math.floor(birthHour / 2) % 12
    const lagna = lagnas[lagnaIndex]

    // Prompt Gemini for detailed analysis
    const prompt = `You are an expert Vedic astrologer. Analyze the following birth chart:

Name: ${name}
Date of Birth: ${dob}
Time of Birth: ${tob}
Place of Birth: ${pob}
Approximate Sun Sign (Vedic): ${sunSign}
Approximate Lagna (Ascendant): ${lagna}

Please provide a detailed Vedic astrology reading in the following JSON format ONLY (no other text):
{
  "planets": [
    {"name": "Sun", "rashi": "Rashi name in Sanskrit and English", "house": 1},
    {"name": "Moon", "rashi": "...", "house": 2},
    {"name": "Mars", "rashi": "...", "house": 3},
    {"name": "Mercury", "rashi": "...", "house": 4},
    {"name": "Jupiter", "rashi": "...", "house": 5},
    {"name": "Venus", "rashi": "...", "house": 6},
    {"name": "Saturn", "rashi": "...", "house": 7},
    {"name": "Rahu", "rashi": "...", "house": 8},
    {"name": "Ketu", "rashi": "...", "house": 9}
  ],
  "analysis": "A comprehensive markdown-formatted analysis covering: 1) Lagna and personality 2) Career and finances 3) Relationships and marriage 4) Health 5) Current dasha period for year ${new Date().getFullYear()} 6) Key remedies (specific mantras, gemstones, fasting days) 7) Auspicious periods in next 12 months. Use **bold** for planet names. Use proper headers with ### for each section. Make it personal and warm, addressing ${name} directly."
}

Base the planet positions on the actual birth date and time provided. Estimate using your knowledge of planetary cycles and positions for that date.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2000 }
        })
      }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from response
    let result = { planets: [], analysis: '' }
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) result = JSON.parse(jsonMatch[0])
    } catch (e) {
      // If JSON fails, return text as analysis
      result = {
        planets: [
          { name: 'Sun', rashi: sunSign, house: 1 },
          { name: 'Moon', rashi: lagna, house: 4 },
        ],
        analysis: text || 'Analysis could not be generated. Please try again.'
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    }

  } catch (err) {
    console.error('Kundli function error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error', message: err.message }) }
  }
}
