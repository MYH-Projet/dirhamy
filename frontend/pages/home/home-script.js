document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sticky Navigation ---
    const nav = document.querySelector('.home-nav');
    const scrollProgress = document.querySelector('.scroll-progress');

    window.addEventListener('scroll', () => {
        // Sticky Nav visual toggle
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Scroll Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        scrollProgress.style.width = scrolled + "%";
    });

    // --- 2. Mobile Menu Toggle ---
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-links a');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
    }

    menuBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    // --- 3. FAQ Accordion ---
    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(acc => {
        acc.addEventListener('click', () => {
            // Toggle active class on button
            acc.classList.toggle('active');

            // Toggle panel visibility
            const panel = acc.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });

    // --- 4. AI Demo Simulation ---
    const chips = document.querySelectorAll('.chip');
    const chatDisplay = document.getElementById('chat-display');
    const chatInput = document.querySelector('.chat-input-area input');

    const aiResponses = {
        "Why did I overspend this month?": "Analysis: Your dining out expenses were 40% higher than last month. Consider cooking at home on weekends to save ~400DH.",
        "Suggest a budget plan for next month.": "Based on your income, I recommend the 50/30/20 rule: 50% Needs (Rent, Food), 30% Wants (Entertainment), 20% Savings.",
        "How can I save 500 MAD more?": "You have 3 recurring subscriptions totaling 450DH that you haven't used recently. Canceling them would nearly reach your goal!"
    };

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');

            // 1. Add User Message
            appendMessage(promptText, 'user-message');

            // 2. Simulate Typing in Input
            chatInput.placeholder = "AI is typing...";

            // 3. Fake Delay for AI Response
            setTimeout(() => {
                const response = aiResponses[promptText] || "I can help with that! Please sign in to access your real data.";
                appendMessage(response, 'ai-message');
                chatInput.placeholder = "Type a message...";
            }, 1000);
        });
    });

    function appendMessage(text, className) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', className);
        msgDiv.textContent = text;

        // Animation
        msgDiv.style.opacity = '0';
        msgDiv.style.transform = 'translateY(10px)';

        chatDisplay.appendChild(msgDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight; // Auto scroll to bottom

        // Trigger animation
        requestAnimationFrame(() => {
            msgDiv.style.transition = 'all 0.3s ease';
            msgDiv.style.opacity = '1';
            msgDiv.style.transform = 'translateY(0)';
        });
    }

    // --- 5. Intersection Observer for Scroll Animations ---
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll('.feature-card, .sec-item, .step-item');

    animatedElements.forEach((el, index) => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `all 0.5s ease ${index * 0.1}s`; // Staggered delay

        observer.observe(el);
    });

});
