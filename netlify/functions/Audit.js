export async function handler(event) {
  console.log("AUDIT LOG:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
