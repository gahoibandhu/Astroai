async function send() {
  const msg = document.getElementById("msg").value;

  const res = await fetch("/.netlify/functions/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  document.getElementById("out").innerText = data.reply;

  // Audit log
  fetch("/.netlify/functions/audit", {
    method: "POST",
    body: JSON.stringify({
      action: "chat",
      input: msg,
      output: data.reply
    })
  });
}