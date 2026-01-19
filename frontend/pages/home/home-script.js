/**
 * Dirhamy Premium Homepage Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Sticky Navbar Effect
    const nav = document.querySelector('.home-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });


    // 2. Mobile Drawer Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const drawerClose = document.querySelector('.drawer-close');
    const drawer = document.querySelector('.mobile-drawer');
    const drawerLinks = document.querySelectorAll('.drawer-links a');

    function toggleDrawer(isOpen) {
        if (isOpen) {
            drawer.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            drawer.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (menuToggle) menuToggle.addEventListener('click', () => toggleDrawer(true));
    if (drawerClose) drawerClose.addEventListener('click', () => toggleDrawer(false));

    // Close drawer when clicking a link
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => toggleDrawer(false));
    });


    // 3. Feature Tiles Selection (Visual flair only)
    const tiles = document.querySelectorAll('.tile-btn');
    tiles.forEach(tile => {
        tile.addEventListener('mouseenter', () => {
            // Remove active from all
            tiles.forEach(t => t.classList.remove('active'));
            // Add to hovered
            tile.classList.add('active');
        });
    });


    // 4. AI Chat Bot Demo (Interactive)
    const chips = document.querySelectorAll('.ai-chip');
    const chatStream = document.getElementById('chat-stream');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    const responses = {
        "overspending analysis": "I noticed you spent <strong>1,200 MAD</strong> on dining out this month. That's 20% higher than your average. Try cooking at home this weekend! 🍳",
        "save 500 mad": "To save <strong>500 MAD</strong>, I recommend cutting back on subscription services (approx. 200 MAD) and limiting daily coffee runs. ☕",
        "budget summary": "Your weekly spending is on track! You've spent <strong>45%</strong> of your monthly budget with 2 weeks to go. Great job avoiding impulse buys.",
        "default": "I can help with that! I'm analyzing your recent transactions... Try asking about your 'savings' or 'food budget'."
    };

    function handleUserMessage(msg) {
        if (!msg) return;

        // 1. Add User Msg
        addMessage(msg, 'user');

        // Clear input if source was input
        if (chatInput.value === msg) chatInput.value = '';

        // 2. Typing Delay
        showTyping();

        // 3. Bot Response
        setTimeout(() => {
            removeTyping();
            let key = msg.toLowerCase();
            let response = responses['default'];

            // Simple Keyword Matching
            if (key.includes('save')) response = responses['save 500 mad'];
            else if (key.includes('spend') || key.includes('why')) response = responses['overspending analysis'];
            else if (key.includes('summary') || key.includes('budget')) response = responses['budget summary'];

            addMessage(response, 'bot');
        }, 1200);
    }

    // Chip Click
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            handleUserMessage(chip.getAttribute('data-msg'));
        });
    });

    // Send Button Click
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            handleUserMessage(chatInput.value.trim());
        });
    }

    // Enter Key
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserMessage(chatInput.value.trim());
        });
    }

    function addMessage(html, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${type}`;
        msgDiv.innerHTML = html;
        chatStream.appendChild(msgDiv);
        chatStream.scrollTop = chatStream.scrollHeight;
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg bot typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        chatStream.appendChild(typingDiv);
        chatStream.scrollTop = chatStream.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

});
