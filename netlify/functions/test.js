// netlify/functions/test.js — finds available models for your key
exports.handler = async (event) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { statusCode: 200, body: JSON.stringify({ error: 'No API key' }) }

  // List all available models
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    )
    const data = await res.json()
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name)
    
    // Try the first available model
    let testReply = null
    if (models.length > 0) {
      const modelName = models[0].replace('models/', '')
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }],
            generationConfig: { maxOutputTokens: 20 }
          })
        }
      )
      const testData = await testRes.json()
      testReply = testData.candidates?.[0]?.content?.parts?.[0]?.text || testData.error?.message
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyPrefix: apiKey.slice(0, 10),
        availableModels: models,
        testWithFirstModel: testReply
      })
    }
  } catch(e) {
    return { statusCode: 200, body: JSON.stringify({ error: e.message }) }
  }
}
