// netlify/functions/remedies.js
// World-class remedies engine combining Vedic, Lal Kitab, Bhrigu, Numerology

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { planet, problem, userName, birthDate } = JSON.parse(event.body)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'AI not configured' }) }

    const query = planet ? `weak or afflicted ${planet} in birth chart` : problem

    const prompt = `You are the world's most knowledgeable Vedic astrology remedies expert, combining:
- Classical Parashari Vedic astrology (Brihat Parashara Hora Shastra)
- Lal Kitab (the revolutionary Persian-Urdu astrology system)
- Bhrigu Nadi (predictive pattern-based remedies)
- Pythagorean & Chaldean Numerology
- Tantric and Agamic traditions
- KN Rao school of practical remedies

The seeker's name is: ${userName || 'the seeker'}
${birthDate ? `Date of birth: ${birthDate}` : ''}
Their concern: ${query}

Provide the most comprehensive, practical, spiritually powerful remedy plan. Respond ONLY in this exact JSON format:

{
  "title": "Short title for this remedy plan (e.g. 'Saturn Affliction Remedies')",
  "summary": "2-3 sentence overview of why these remedies are prescribed and what they will achieve",
  "remedies": [
    {
      "category": "Mantra",
      "icon": "🕉",
      "system": "Vedic",
      "primary": "The main mantra to chant (in Sanskrit with transliteration)",
      "detail": "How many times, which day, which time, facing which direction, for how many days",
      "power": "Why this mantra works — the spiritual science behind it",
      "level": "beginner"
    },
    {
      "category": "Beej Mantra",
      "icon": "✨",
      "system": "Tantric Vedic",
      "primary": "The seed mantra",
      "detail": "Repetition count and timing",
      "power": "Vibrational significance",
      "level": "advanced"
    },
    {
      "category": "Gemstone",
      "icon": "💎",
      "system": "Vedic Jyotish",
      "primary": "Primary gemstone recommendation with minimum weight in carats",
      "detail": "Which metal to set in, which finger, which day to wear, how to energise it first",
      "power": "How this gem channels planetary energy",
      "level": "intermediate"
    },
    {
      "category": "Upratna (Substitute)",
      "icon": "🔮",
      "system": "Vedic Jyotish",
      "primary": "Affordable substitute gemstone",
      "detail": "Wearing instructions",
      "power": "Why this works as substitute",
      "level": "beginner"
    },
    {
      "category": "Fasting",
      "icon": "🌙",
      "system": "Vedic",
      "primary": "Day of the week to fast and what type of fast",
      "detail": "What to eat, what to avoid, break fast timing, duration of practice",
      "power": "The planetary connection of this day and fasting's purifying effect",
      "level": "beginner"
    },
    {
      "category": "Donation (Daan)",
      "icon": "🤲",
      "system": "Vedic + Lal Kitab",
      "primary": "Specific items to donate",
      "detail": "To whom, on which day, at what time, for how many consecutive days",
      "power": "How charity neutralises planetary karma",
      "level": "beginner"
    },
    {
      "category": "Lal Kitab Totka",
      "icon": "📕",
      "system": "Lal Kitab",
      "primary": "The Lal Kitab remedy (upay)",
      "detail": "Step-by-step instructions — very specific practical action",
      "power": "Lal Kitab principle behind this remedy",
      "level": "intermediate"
    },
    {
      "category": "Lal Kitab Loan",
      "icon": "🪙",
      "system": "Lal Kitab",
      "primary": "The Lal Kitab 'loan' remedy if applicable",
      "detail": "What to give, to whom, how to 'repay' it",
      "power": "Lal Kitab debt-clearing principle",
      "level": "intermediate"
    },
    {
      "category": "Bhrigu Nadi Remedy",
      "icon": "📜",
      "system": "Bhrigu Nadi",
      "primary": "Bhrigu system remedy for this planetary pattern",
      "detail": "Specific actions prescribed in Bhrigu tradition",
      "power": "The karmic pattern this addresses",
      "level": "advanced"
    },
    {
      "category": "Numerology",
      "icon": "🔢",
      "system": "Numerology",
      "primary": "Lucky number, colour, day based on the concern",
      "detail": "How to use these numbers in daily life — phone number digits, house number, etc.",
      "power": "Numerological vibration that counterbalances the issue",
      "level": "beginner"
    },
    {
      "category": "Temple & Deity",
      "icon": "🛕",
      "system": "Vedic",
      "primary": "Which deity to worship and which temple type to visit",
      "detail": "Specific puja to perform, what to offer, how many Tuesdays/Saturdays etc.",
      "power": "The deity's connection to this planetary energy",
      "level": "beginner"
    },
    {
      "category": "Yantra",
      "icon": "⬡",
      "system": "Tantric Vedic",
      "primary": "Which yantra to install or wear",
      "detail": "How to energise, where to place, which metal",
      "power": "Geometric energy of this yantra",
      "level": "advanced"
    },
    {
      "category": "Rudraksha",
      "icon": "📿",
      "system": "Shaiva Vedic",
      "primary": "Which mukhi Rudraksha to wear",
      "detail": "How to wear, how to energise, which thread/metal",
      "power": "The Shiva connection and healing properties",
      "level": "intermediate"
    },
    {
      "category": "Spiritual Practice",
      "icon": "🧘",
      "system": "Vedic + Yogic",
      "primary": "Specific meditation, pranayama, or yogic practice",
      "detail": "Duration, timing, technique details",
      "power": "How this practice harmonises the planetary energy",
      "level": "beginner"
    }
  ],
  "cautions": "2-3 important things to avoid while following these remedies",
  "timeline": "Realistic timeline — when to expect results (e.g. 40 days, 3 months, 1 year)",
  "priority": ["category1", "category2", "category3"]
}

The priority array should list the 3 most important remedy categories to start with first.
Make ALL remedies extremely specific, practical, and actionable. No vague advice.
Base on authentic classical texts. This should be genuinely helpful.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 3000 }
        })
      }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let result = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) result = JSON.parse(jsonMatch[0])
      else result = { error: 'Could not parse response', raw: text }
    } catch (e) {
      result = { error: 'Parse error', raw: text }
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    console.error('remedies error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
