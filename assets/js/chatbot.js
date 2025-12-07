/**
 * Golden Bond - Live Chat & FAQ Bot
 * Professional chatbot for customer support
 */

class LiveChat {
  constructor() {
    this.isOpen = false;
    this.faqs = this.loadFAQs();
    this.init();
  }

  loadFAQs() {
    return {
      "signup": {
        keywords: ["signup", "register", "create account", "join", "become member"],
        answers: [
          "To create an account, click on 'Sign Up' in the top navigation or visit the Sign Up page. Fill in your basic information, create a password, and verify your email. The process is completely free and takes just a few minutes.",
          "Yes, creating a profile is absolutely free! You can browse profiles, create your profile, and get started without any charges. Premium membership is optional for additional features."
        ]
      },
      "search": {
        keywords: ["search", "find", "browse", "profiles", "filter"],
        answers: [
          "You can search for profiles using our advanced filters. Go to the Search page and use filters like age, religion, community, location, education, and more to find your perfect match.",
          "Yes, you can search profiles without creating an account, but you'll need to sign up to view complete profiles and contact members."
        ]
      },
      "membership": {
        keywords: ["membership", "premium", "paid", "pricing", "subscription", "upgrade"],
        answers: [
          "We offer three membership plans: Gold, Diamond, and Elite. Each plan provides different features like viewing full profiles, contacting matches, priority support, and more. Visit the Membership page for detailed pricing.",
          "Premium membership gives you access to view complete profiles, unlimited messages, priority customer support, verified badge, and advanced search filters."
        ]
      },
      "verification": {
        keywords: ["verified", "verification", "trust", "security", "safe"],
        answers: [
          "All profiles go through our verification process including email verification, phone verification, and document verification. This ensures you connect with genuine people.",
          "Verified profiles have a green checkmark badge. This means the profile has been verified by our team and is authentic."
        ]
      },
      "contact": {
        keywords: ["contact", "support", "help", "phone", "email", "customer service"],
        answers: [
          "You can reach our customer support team through phone at +91-9876543210 (Mon-Sun, 9 AM - 9 PM IST), email at support@goldenbond.com, or use this live chat feature.",
          "Our customer support team is available 24/7 through this chat. For urgent matters, call us at +91-9876543210 during business hours."
        ]
      },
      "payment": {
        keywords: ["payment", "pay", "stripe", "razorpay", "refund", "billing"],
        answers: [
          "We accept payments through Stripe (credit/debit cards) and Razorpay (for Indian users). All payments are secure and encrypted.",
          "You can cancel your membership anytime from your dashboard. Refunds are processed according to our refund policy based on unused subscription time."
        ]
      },
      "privacy": {
        keywords: ["privacy", "data", "information", "security", "personal"],
        answers: [
          "We take your privacy seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your consent.",
          "You can control your profile visibility in your account settings. You can choose who can see your profile and contact you."
        ]
      },
      "second marriage": {
        keywords: ["second marriage", "divorced", "widowed", "remarriage"],
        answers: [
          "Yes, we welcome everyone including those seeking a second marriage. Our platform is designed to help people find love again, whether divorced or widowed.",
          "You can specify your marital status during profile creation. We have specific filters to help you find compatible matches who understand your situation."
        ]
      },
      "default": {
        keywords: [],
        answers: [
          "I'm here to help! Please ask me about signup, membership, search, verification, payments, or privacy. You can also contact our support team at support@goldenbond.com or +91-9876543210.",
          "How can I assist you today? I can help with account creation, membership plans, searching profiles, or answer questions about our services."
        ]
      }
    };
  }

  init() {
    this.createChatWidget();
    this.attachEventListeners();
  }

  createChatWidget() {
    const chatHTML = `
      <div id="chatWidget" class="chat-widget ${this.isOpen ? 'open' : ''}">
        <div class="chat-header" id="chatToggle">
          <div class="chat-header-content">
            <span class="chat-icon">💬</span>
            <div class="chat-header-text">
              <h4>Live Chat Support</h4>
              <span class="chat-status">Online</span>
            </div>
          </div>
          <button class="chat-close-btn" id="chatCloseBtn">×</button>
        </div>
        <div class="chat-body" id="chatBody">
          <div class="chat-messages" id="chatMessages">
            <div class="chat-message bot-message">
              <div class="message-content">
                <p>👋 Hello! I'm here to help you with any questions about Golden Bond.</p>
                <p>Ask me about:</p>
                <ul class="quick-options">
                  <li>📝 Signing up</li>
                  <li>💎 Membership plans</li>
                  <li>🔍 Searching profiles</li>
                  <li>✓ Verification process</li>
                  <li>💳 Payments</li>
                  <li>🔒 Privacy & Security</li>
                </ul>
              </div>
              <span class="message-time">Just now</span>
            </div>
          </div>
          <div class="chat-input-area">
            <input type="text" id="chatInput" placeholder="Type your question here..." autocomplete="off">
            <button id="chatSendBtn" class="chat-send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <button id="chatFab" class="chat-fab" aria-label="Open Live Chat">
        <span class="fab-icon">💬</span>
        <span class="fab-badge"></span>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  attachEventListeners() {
    const chatFab = document.getElementById('chatFab');
    const chatToggle = document.getElementById('chatToggle');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');

    if (chatFab) {
      chatFab.addEventListener('click', () => this.openChat());
    }

    if (chatToggle) {
      chatToggle.addEventListener('click', () => this.toggleChat());
    }

    if (chatCloseBtn) {
      chatCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeChat();
      });
    }

    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });

      // Auto-resize textarea (if using textarea instead)
      chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
      });
    }

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
      const chatWidget = document.getElementById('chatWidget');
      if (chatWidget && !chatWidget.contains(e.target) && !chatFab.contains(e.target)) {
        if (this.isOpen && e.target.id !== 'chatFab') {
          // Keep chat open on mobile, close on desktop
          if (window.innerWidth > 768) {
            // this.closeChat();
          }
        }
      }
    });
  }

  openChat() {
    this.isOpen = true;
    const chatWidget = document.getElementById('chatWidget');
    const chatFab = document.getElementById('chatFab');
    if (chatWidget) chatWidget.classList.add('open');
    if (chatFab) chatFab.style.display = 'none';
    const chatInput = document.getElementById('chatInput');
    if (chatInput) setTimeout(() => chatInput.focus(), 300);
  }

  closeChat() {
    this.isOpen = false;
    const chatWidget = document.getElementById('chatWidget');
    const chatFab = document.getElementById('chatFab');
    if (chatWidget) chatWidget.classList.remove('open');
    if (chatFab) chatFab.style.display = 'flex';
  }

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');

    // Clear input
    chatInput.value = '';

    // Simulate typing
    setTimeout(() => {
      const response = this.getResponse(message);
      this.addMessage(response, 'bot');
    }, 800);
  }

  addMessage(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (type === 'bot' && typeof message === 'object' && message.type === 'options') {
      // Display as options
      const p = document.createElement('p');
      p.textContent = message.text;
      messageContent.appendChild(p);

      if (message.options) {
        const optionsList = document.createElement('ul');
        optionsList.className = 'quick-options';
        message.options.forEach(option => {
          const li = document.createElement('li');
          li.textContent = option;
          li.style.cursor = 'pointer';
          li.addEventListener('click', () => {
            this.addMessage(option, 'user');
            setTimeout(() => {
              const response = this.getResponse(option);
              this.addMessage(response, 'bot');
            }, 800);
          });
          optionsList.appendChild(li);
        });
        messageContent.appendChild(optionsList);
      }
    } else {
      const p = document.createElement('p');
      p.textContent = typeof message === 'string' ? message : message.text;
      messageContent.appendChild(p);
    }

    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.textContent = this.getCurrentTime();

    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  getResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Check each FAQ category
    for (const [category, data] of Object.entries(this.faqs)) {
      if (category === 'default') continue;

      const matches = data.keywords.some(keyword => message.includes(keyword));
      if (matches) {
        return data.answers[Math.floor(Math.random() * data.answers.length)];
      }
    }

    // Default response
    return this.faqs.default.answers[Math.floor(Math.random() * this.faqs.default.answers.length)];
  }

  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}

// Initialize chat when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LiveChat();
  });
} else {
  new LiveChat();
}

