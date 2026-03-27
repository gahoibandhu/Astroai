export async function handler(event) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const body = JSON.parse(event.body || "{}");
    const message = body.message || "Hello";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply:
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response from AI"
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
}
