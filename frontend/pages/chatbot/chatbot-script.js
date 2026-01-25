import { loadInitialStructure } from "/helpers/utils.js";

// Initialize user data if needed
const user = {};
loadInitialStructure(user).then(() => {
  // UI elements
  const messagesDiv = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const suggestions = document.querySelectorAll(".suggestion-chip");
  const emptyState = document.querySelector(".empty-state");

  const scrollToBottom = () => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  const addMessage = (text, sender, isTyping = false) => {
    // Hide empty state on first message
    if (emptyState) emptyState.style.display = "none";

    const msg = document.createElement("div");
    msg.classList.add("message", sender);

    if (isTyping) {
      msg.classList.add("typing-indicator");
      msg.innerHTML = "<span></span><span></span><span></span>";
    } else {
      msg.textContent = text;
    }

    messagesDiv.appendChild(msg);
    scrollToBottom();
    return msg;
  };

  const sendMessage = async (text = null) => {
    const userMsg = text || input.value.trim();
    if (!userMsg) return;

    addMessage(userMsg, "user");
    input.value = "";

    // Update context based on user input and rotate chips
    if (typeof detectContext === "function") detectContext(userMsg);
    if (typeof resetRotationTimer === "function") resetRotationTimer();
    // Optional: Refresh chips immediately after send to show "what's next"
    setTimeout(() => {
      if (typeof renderSuggestions === "function") renderSuggestions();
    }, 1000);

    // Add typing indicator
    const typingMsg = addMessage("", "ai", true);

    try {
      console.log("Sending message to server");
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      console.log(response);
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();

      // Remove typing indicator and add actual response
      document.querySelector(".typing-indicator")?.remove(); // remove animation
      addMessage(data.reply, "ai");
    } catch (e) {
      console.error(e);
      document.querySelector(".typing-indicator")?.remove();
      addMessage("Error: could not fetch response.", "ai");
    }
  };

  // Suggestions Data Pool
  const suggestionsData = {
    overview: [
      "Summarize my spending this week",
      "Show my recent transactions",
      "How much did I spend this month?",
      "What is my balance?",
      "Weekly spending detailed report",
      "Total expenses vs income",
      "Did I stick to my budget?",
      "Show spending breakdown",
    ],
    saving: [
      "How can I save 500 MAD this month?",
      "Set a savings goal for a car",
      "Tips to save money on groceries",
      "Create a savings plan",
      "How much should I save?",
      "Help me build an emergency fund",
      "Savings opportunities analysis",
      "Track my savings progress",
    ],
    budget: [
      "Create a budget for food",
      "Set a limit for entertainment",
      "Am I over my shopping budget?",
      "Adjust my travel budget",
      "Suggest a realistic budget",
      "Budget vs Actual for this month",
      "Categorize my unassigned expenses",
      "How much is left for dining out?",
    ],
    overspending: [
      "Why did I overspend?",
      "Alert me if I exceed 2000 MAD",
      "Analyze my high spending areas",
      "Cut down unnecessary expenses",
      "Where can I reduce costs?",
      "Spending patterns analysis",
      "Identify impulse purchases",
      "Compare with last month's spending",
    ],
    general: [
      "What can you do?",
      "Help me manage my finances",
      "Financial health checkup",
      "Start a new financial goal",
      "Reset my preferences",
      "Export my transaction history",
      "Forecast my expenses",
      "Smart financial advice",
    ],
  };

  // State for suggestions
  let currentContext = "overview";
  let displayedSuggestions = new Set();
  let rotationInterval;

  const getSuggestions = (context = "overview") => {
    // Determine the primary category based on context
    let pool = suggestionsData[context] || suggestionsData.overview;

    // If we don't have enough specific chips, mix in some general ones
    if (pool.length < 4) {
      pool = [...pool, ...suggestionsData.general];
    }

    // Select 4 unique random suggestions
    const selected = [];
    const available = pool.filter((s) => !displayedSuggestions.has(s));

    // If we've shown most of them, reset the history
    const candidates = available.length < 4 ? pool : available;

    // Shuffle and pick 4
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const renderSuggestions = (context = currentContext) => {
    const container = document.getElementById("chat-suggestions");
    if (!container) return;

    const chips = getSuggestions(context);

    // Update history
    chips.forEach((c) => displayedSuggestions.add(c));
    if (displayedSuggestions.size > 15) displayedSuggestions.clear(); // keep history bounded

    // Clear and render new chips
    container.innerHTML = "";
    chips.forEach((text, index) => {
      const btn = document.createElement("button");
      btn.className = "suggestion-chip";
      btn.textContent = text;
      btn.style.animationDelay = `${index * 50}ms`; // Stagger animations

      btn.addEventListener("click", () => {
        sendMessage(text);
        detectContext(text); // switch context immediately
        resetRotationTimer(); // restart timer
        renderSuggestions(); // fresh chips immediately
      });

      container.appendChild(btn);
    });
  };

  const detectContext = (text) => {
    const lower = text.toLowerCase();
    if (
      lower.includes("budget") ||
      lower.includes("category") ||
      lower.includes("class")
    )
      currentContext = "budget";
    else if (
      lower.includes("save") ||
      lower.includes("goal") ||
      lower.includes("fund")
    )
      currentContext = "saving";
    else if (
      lower.includes("overspend") ||
      lower.includes("limit") ||
      lower.includes("exceed")
    )
      currentContext = "overspending";
    else if (
      lower.includes("summary") ||
      lower.includes("week") ||
      lower.includes("month") ||
      lower.includes("balance")
    )
      currentContext = "overview";
    else if (Math.random() > 0.7) currentContext = "general"; // occasionally switch to general
  };

  const startRotationTimer = () => {
    clearInterval(rotationInterval);
    const randomTime = 8000 + Math.random() * 4000; // 8-12s
    rotationInterval = setInterval(() => {
      renderSuggestions();
    }, randomTime);
  };

  const resetRotationTimer = () => {
    startRotationTimer();
  };

  // Initialize
  renderSuggestions();
  startRotationTimer();

  // Refresh Button Logic
  document
    .getElementById("refresh-suggestions")
    ?.addEventListener("click", () => {
      renderSuggestions();
      resetRotationTimer();
    });

  // Event Listeners
  sendBtn.addEventListener("click", () => sendMessage());

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // No static suggestions listener needed anymore as they are dynamic
});
