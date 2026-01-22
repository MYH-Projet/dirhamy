import { loadInitialStructure } from "../../utils/utils.js";

// Initialize user data if needed
const user = {};
loadInitialStructure(user).then(() => {
  // UI elements
  const messagesDiv = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  const addMessage = (text, sender) => {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  const sendMessage = async () => {
    const userMsg = input.value.trim();
    if (!userMsg) return;
    addMessage(userMsg, "user");
    input.value = "";
    // placeholder for AI response
    addMessage("…", "ai");
    try {
      console.log("Sending message to server");
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      console.log(response);
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();
      // replace placeholder with actual reply
      const placeholder = messagesDiv.querySelector(".message.ai:last-child");
      if (placeholder) placeholder.textContent = data.reply;
    } catch (e) {
      console.error(e);
      const placeholder = messagesDiv.querySelector(".message.ai:last-child");
      if (placeholder) placeholder.textContent = "Error: could not fetch response.";
    }
  };

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});




// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  console.log(user);
});
