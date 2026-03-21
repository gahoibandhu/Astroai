// netlify/functions/ramshalaka.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  try {
    const { question, selectedChars, positions } = JSON.parse(event.body)
    const apiKey = process.env.GEMINI_API_KEY

    const prompt = `You are the sacred Ram Shalaka oracle, a divine tool from the Ramayana tradition used to seek guidance from Lord Ram.

The seeker has asked: "${question}"

They have selected these 9 letters from the Ram Shalaka grid (by intuition): ${selectedChars}
Grid positions selected: ${JSON.stringify(positions)}

The Ram Shalaka is traditionally from the Ramcharitmanas. Based on the letters selected and the ancient oracle tradition, provide:

1. **The Omen** — Is this favorable, unfavorable, or mixed? Be specific.
2. **Divine Message** — What does Lord Ram's oracle say about this question? Give a 2-3 sentence guidance inspired by the Ramayana's wisdom.
3. **What to Do** — One practical spiritual action (prayer, mantra, donation, etc.)
4. **Caution** — If any, what to be mindful of

Write in a warm, reverent, spiritual tone. Reference the Ramayana tradition. Keep it under 200 words total. Use markdown formatting.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    )

    const data = await response.json()
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'The oracle is silent. Try again with a focused mind.'

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer }) }
  } catch (err) {
    console.error('ramshalaka error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
