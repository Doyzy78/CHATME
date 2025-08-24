const BOT_TOKEN = "8154035541:AAFVH8nY3e7U0Mqg9nRiR2bPSTLLpiKJVuk";
const CHAT_ID = "6719980679";
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`; // <-- fixed URL

const topLeft = document.getElementById("top-left");
const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const musicControl = document.getElementById("musicControl");
const bgMusic = document.getElementById("bgMusic");

// Music selector
musicControl.addEventListener("change", () => {
  if (musicControl.value) {
    bgMusic.src = musicControl.value;
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
});

// Fetch bot profile
async function loadBotProfile() {
  try {
    const res = await fetch(`${API_URL}/getMe`);
    const data = await res.json();
    if (!data.ok) throw new Error("Failed to fetch bot info");

    const { first_name: name, username, id: botId } = data.result;

    const photosRes = await fetch(`${API_URL}/getUserProfilePhotos?user_id=${botId}&limit=1`);
    const photosData = await photosRes.json();

    let profileImg = "";
    if (photosData.ok && photosData.result.total_count > 0) {
      const fileId = photosData.result.photos[0][0].file_id;
      const fileRes = await fetch(`${API_URL}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (fileData.ok) profileImg = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
    }

    topLeft.innerHTML = profileImg
      ? `<img src="${profileImg}" alt="Bot profile"> <b>Bot:</b> ${name}`
      : `<b>Bot:</b> ${name}`;
  } catch (err) {
    console.error(err);
    topLeft.innerText = "Failed to load bot profile.";
  }
}
loadBotProfile();

// Add message
function addMessage(text, messageId) {
  const msg = document.createElement("div");
  msg.className = "message";
  msg.innerText = text;

  const delBtn = document.createElement("button");
  delBtn.innerText = "✖";
  delBtn.className = "delete-btn";
  delBtn.onclick = () => deleteMessage(messageId, msg);

  msg.appendChild(delBtn);
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

// Send message
sendBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`${API_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text })
    });
    const data = await res.json();
    if (data.ok) {
      addMessage(`Me: ${text}`, data.result.message_id);
      input.value = "";
    } else {
      alert("Send failed: " + data.description);
    }
  } catch (err) {
    console.error(err);
  }
});

// Delete message
async function deleteMessage(msgId, msgElem) {
  try {
    const res = await fetch(`${API_URL}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, message_id: msgId })
    });
    const data = await res.json();
    if (data.ok) msgElem.remove();
    else alert("Delete failed: " + data.description);
  } catch (err) {
    console.error(err);
  }
}

// Fetch updates
let offset = 0;
async function fetchMessages() {
  try {
    const res = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=1`);
    const data = await res.json();
    if (!data.ok) throw new Error("Failed to fetch updates");

    data.result.forEach(update => {
      offset = update.update_id + 1;
      if (update.message && update.message.text) {
        const from = update.message.from.first_name || "User";
        addMessage(`${from}: ${update.message.text}`, update.message.message_id);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

setInterval(fetchMessages, 3000);
