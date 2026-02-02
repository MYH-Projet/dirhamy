import { loadInitialStructure } from "/helpers/utils.js";

// Initialize user data if needed
const user = {};
loadInitialStructure(user).then(async () => {
  // UI elements
  const messagesDiv = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const emptyState = document.querySelector(".empty-state");
  const conversationList = document.getElementById("conversation-list");
  const sidebar = document.getElementById("chat-sidebar");

  // State
  let currentConversationId = null;
  let conversations = [];

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

  const clearMessages = () => {
    messagesDiv.innerHTML = "";
    if (emptyState) {
      messagesDiv.appendChild(emptyState);
      emptyState.style.display = "";
    }
  };

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/ai/conversations");
      if (!response.ok) return;

      const data = await response.json();
      conversations = data.conversations || [];
      renderConversationList();
      console.log(`📚 Loaded ${conversations.length} conversations`);
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
  };

  const renderConversationList = () => {
    if (conversations.length === 0) {
      conversationList.innerHTML = `
        <div class="no-conversations">
          <p>No conversations yet</p>
        </div>
      `;
      return;
    }

    conversationList.innerHTML = conversations.map(conv => `
      <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}" data-id="${conv.id}">
        <p class="conv-title" data-id="${conv.id}">${escapeHtml(conv.title)}</p>
        <p class="conv-preview">${conv.lastMessage ? escapeHtml(conv.lastMessage) : 'No messages'}</p>
        <div class="conv-actions">
          <button class="conv-edit" data-id="${conv.id}" title="Rename">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="conv-delete" data-id="${conv.id}" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add click handlers for selecting conversation
    conversationList.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.conv-delete') || e.target.closest('.conv-edit') || e.target.closest('.conv-title-input')) return;
        const id = parseInt(item.dataset.id);
        selectConversation(id);
      });
    });

    // Add click handlers for delete
    conversationList.querySelectorAll('.conv-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        if (confirm("Delete this conversation?")) {
          await deleteConversation(id);
        }
      });
    });

    // Add click handlers for edit/rename
    conversationList.querySelectorAll('.conv-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        startEditingTitle(id);
      });
    });

    // Double-click on title to edit
    conversationList.querySelectorAll('.conv-title').forEach(title => {
      title.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const id = parseInt(title.dataset.id);
        startEditingTitle(id);
      });
    });
  };

  const startEditingTitle = (conversationId) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const item = conversationList.querySelector(`.conversation-item[data-id="${conversationId}"]`);
    const titleEl = item.querySelector('.conv-title');

    // Replace title with input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'conv-title-input';
    input.value = conv.title;
    input.dataset.id = conversationId;

    titleEl.replaceWith(input);
    input.focus();
    input.select();

    // Save on Enter or blur
    const saveTitle = async () => {
      const newTitle = input.value.trim() || 'New Chat';
      await renameConversation(conversationId, newTitle);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTitle();
      } else if (e.key === 'Escape') {
        renderConversationList(); // Cancel edit
      }
    });

    input.addEventListener('blur', saveTitle);
  };

  const renameConversation = async (id, newTitle) => {
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (response.ok) {
        await loadConversations();
      }
    } catch (e) {
      console.error("Failed to rename conversation:", e);
      renderConversationList();
    }
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const selectConversation = async (id) => {
    currentConversationId = id;
    renderConversationList();
    await loadMessages(id);
  };

  const loadMessages = async (conversationId) => {
    try {
      clearMessages();
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
          addMessage(msg.content, msg.sender);
        });
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  const createConversation = async () => {
    try {
      const response = await fetch("/api/ai/conversations", { method: "POST" });
      if (!response.ok) return null;

      const data = await response.json();
      currentConversationId = data.conversation.id;
      await loadConversations();
      clearMessages();
      return data.conversation.id;
    } catch (e) {
      console.error("Failed to create conversation:", e);
      return null;
    }
  };

  const deleteConversation = async (id) => {
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      if (response.ok) {
        if (currentConversationId === id) {
          currentConversationId = null;
          clearMessages();
        }
        await loadConversations();
        // Select first conversation if available
        if (conversations.length > 0 && !currentConversationId) {
          selectConversation(conversations[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  };

  // ============================================
  // SEND MESSAGE
  // ============================================

  const sendMessage = async (text = null) => {
    const userMsg = text || input.value.trim();
    if (!userMsg) return;

    // Create new conversation if needed
    if (!currentConversationId) {
      await createConversation();
    }

    addMessage(userMsg, "user");
    input.value = "";

    // Add typing indicator
    const typingMsg = addMessage("", "ai", true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          conversationId: currentConversationId
        }),
      });

      if (!response.ok) throw new Error("Network error");
      const data = await response.json();

      // Update conversationId if returned (for new conversations)
      if (data.conversationId) {
        currentConversationId = data.conversationId;
      }

      // Remove typing indicator and add actual response
      document.querySelector(".typing-indicator")?.remove();
      addMessage(data.reply, "ai");

      // Refresh conversation list to update title/preview
      await loadConversations();
    } catch (e) {
      console.error(e);
      document.querySelector(".typing-indicator")?.remove();
      addMessage("Error: could not fetch response.", "ai");
    }
  };

  // ============================================
  // SUGGESTIONS (keeping existing functionality)
  // ============================================

  const suggestionsData = {
    overview: [
      "Summarize my spending this week",
      "Show my recent transactions",
      "What's my current balance?",
      "How much have I spent today?",
    ],
    budgeting: [
      "Am I on track with my budget?",
      "Which category am I overspending on?",
      "How much can I spend this week?",
      "Suggest a savings goal for me",
    ],
    trends: [
      "Compare my spending to last month",
      "What's my biggest expense category?",
      "Show my income vs expenses",
      "Any unusual charges lately?",
    ],
    tips: [
      "Tips to reduce my expenses",
      "How can I save more?",
      "Advice for my groceries budget",
      "Help me plan for next month",
    ],
  };

  let currentContext = "overview";
  const detectContext = (msg) => {
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("budget") || lowerMsg.includes("limit"))
      currentContext = "budgeting";
    else if (lowerMsg.includes("trend") || lowerMsg.includes("compare"))
      currentContext = "trends";
    else if (lowerMsg.includes("tip") || lowerMsg.includes("save"))
      currentContext = "tips";
    else currentContext = "overview";
  };

  const chipsContainer = document.getElementById("chat-suggestions");
  const getRandomSuggestions = (count = 3) => {
    const pool = [
      ...suggestionsData[currentContext],
      ...suggestionsData.overview,
    ];
    const unique = [...new Set(pool)];
    const shuffled = unique.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const renderSuggestions = () => {
    const chips = getRandomSuggestions(3);
    chipsContainer.innerHTML = chips
      .map(
        (chip, i) =>
          `<button class="suggestion-chip" style="animation-delay: ${i * 0.1}s">${chip}</button>`
      )
      .join("");
    chipsContainer.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => sendMessage(chip.textContent));
    });
  };

  let rotationTimer;
  const startRotationTimer = () => {
    clearTimeout(rotationTimer);
    const randomTime = 8000 + Math.random() * 8000;
    rotationTimer = setTimeout(() => {
      renderSuggestions();
      startRotationTimer();
    }, randomTime);
  };

  // ============================================
  // EVENT LISTENERS
  // ============================================

  // New Chat Button
  document.getElementById("new-chat-btn")?.addEventListener("click", async () => {
    await createConversation();
  });

  // Delete Current Conversation Button
  document.getElementById("delete-conv-btn")?.addEventListener("click", async () => {
    if (currentConversationId && confirm("Delete this conversation?")) {
      await deleteConversation(currentConversationId);
    }
  });

  // Toggle Sidebar (Mobile)
  document.getElementById("toggle-sidebar-btn")?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
  });

  // Refresh Suggestions
  document.getElementById("refresh-suggestions")?.addEventListener("click", () => {
    renderSuggestions();
    startRotationTimer();
  });

  // Send Message
  sendBtn.addEventListener("click", () => sendMessage());

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ============================================
  // INITIALIZE
  // ============================================

  await loadConversations();

  // Select first conversation or show empty state
  if (conversations.length > 0) {
    selectConversation(conversations[0].id);
  }

  renderSuggestions();
  startRotationTimer();
});
