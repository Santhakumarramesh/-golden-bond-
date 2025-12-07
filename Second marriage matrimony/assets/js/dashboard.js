/**
 * Golden Bond - Dashboard & AI Assistant
 * Handles dashboard interactions and AI chatbot functionality
 */

// AI Assistant State
let aiModalOpen = false;
let chatHistory = [];

/**
 * Open AI Assistant Modal
 */
function openAIAssistant() {
  const modal = document.getElementById('aiAssistantModal');
  if (modal) {
    modal.classList.add('active');
    aiModalOpen = true;
    document.getElementById('aiInput').focus();
  }
}

/**
 * Close AI Assistant Modal
 */
function closeAIAssistant() {
  const modal = document.getElementById('aiAssistantModal');
  if (modal) {
    modal.classList.remove('active');
    aiModalOpen = false;
  }
}

/**
 * Handle AI Input Enter Key
 */
function handleAIInput(event) {
  if (event.key === 'Enter') {
    sendAIMessage();
  }
}

/**
 * Send message to AI
 */
function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addChatMessage('user', message);
  input.value = '';
  
  // Simulate AI response (in production, this would call backend API)
  setTimeout(() => {
    const response = generateAIResponse(message);
    addChatMessage('bot', response);
  }, 800);
}

/**
 * Ask AI with predefined prompt
 */
function askAI(prompt) {
  const input = document.getElementById('aiInput');
  input.value = prompt;
  sendAIMessage();
}

/**
 * Add message to chat container
 */
function addChatMessage(sender, message) {
  const container = document.getElementById('aiChatContainer');
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ${sender}`;
  
  const avatar = sender === 'bot' ? '🤖' : '👤';
  
  messageDiv.innerHTML = `
    <span class="ai-avatar">${avatar}</span>
    <div class="ai-bubble">
      <p>${message}</p>
    </div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
  
  // Store in history
  chatHistory.push({ sender, message });
}

/**
 * Generate AI Response (Demo - would be API call in production)
 */
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Match finding queries
  if (message.includes('find') && (message.includes('match') || message.includes('hindu') || message.includes('muslim') || message.includes('christian'))) {
    return `I found some great matches for you! Based on your query, here are my recommendations:

<strong>Top 3 AI-Suggested Matches:</strong>
• Priya S. (94% compatible) - Mumbai, Hindu
• Ananya R. (91% compatible) - Bangalore, Hindu  
• Sarah J. (89% compatible) - London, Christian

Would you like me to filter by specific criteria like age, location, or education?`;
  }
  
  // Profile improvement
  if (message.includes('improve') || message.includes('profile') || message.includes('better')) {
    return `Here are my suggestions to improve your profile:

<strong>📸 Photos:</strong> Add 3-5 clear photos including a close-up and full-length shot.

<strong>📝 Bio:</strong> Your bio is good but could mention your hobbies and what you're looking for.

<strong>✅ Verification:</strong> Get verified to increase trust by 40%!

<strong>🎯 Preferences:</strong> Being more specific about preferences helps our AI find better matches.

Would you like help with any of these?`;
  }
  
  // Compatibility explanation
  if (message.includes('compatibility') || message.includes('score') || message.includes('match %')) {
    return `<strong>How AI Compatibility Works:</strong>

Our AI analyzes multiple factors:

• <strong>Religion & Community (30%)</strong> - Same religion/community gets higher scores
• <strong>Education & Career (20%)</strong> - Similar education levels match better
• <strong>Location (15%)</strong> - Closer locations score higher
• <strong>Age Preference (15%)</strong> - Within preferred range
• <strong>Lifestyle (10%)</strong> - Diet, habits compatibility
• <strong>Family Values (10%)</strong> - Similar family expectations

A 90%+ match is considered excellent!`;
  }
  
  // Premium features
  if (message.includes('premium') || message.includes('upgrade') || message.includes('paid')) {
    return `<strong>Golden Bond Premium Benefits:</strong>

🌟 <strong>Gold Plan (₹999/month):</strong>
• View unlimited profiles
• See who viewed you
• Priority in search results

👑 <strong>Diamond Plan (₹1999/month):</strong>
• All Gold features
• AI-powered match suggestions
• Direct messaging
• Profile boost

💎 <strong>Elite Plan (₹4999/month):</strong>
• All Diamond features
• Personal matchmaking consultant
• Video verification badge
• VIP customer support

Would you like to upgrade now?`;
  }
  
  // Safety
  if (message.includes('safe') || message.includes('fake') || message.includes('scam') || message.includes('report')) {
    return `<strong>Your Safety is Our Priority:</strong>

🔒 <strong>Profile Verification:</strong> Look for the ✓ badge - these profiles are ID-verified.

🚫 <strong>Report Suspicious Behavior:</strong> Use the Report button on any profile.

⚠️ <strong>Red Flags to Watch:</strong>
• Asking for money
• Refusing video calls
• Inconsistent information
• Rushing to move off-platform

💡 <strong>Tips:</strong>
• Never share financial details
• Video call before meeting
• Meet in public places first

Need to report someone? I can help!`;
  }
  
  // How to use
  if (message.includes('how') || message.includes('help') || message.includes('use')) {
    return `<strong>How to Use Golden Bond:</strong>

1️⃣ <strong>Complete Your Profile</strong> - Add photos, bio, and preferences

2️⃣ <strong>Search & Filter</strong> - Use religion, community, location filters

3️⃣ <strong>Send Interest</strong> - Like profiles you're interested in

4️⃣ <strong>Connect</strong> - Chat with mutual matches

5️⃣ <strong>Meet</strong> - Take it offline when comfortable!

<strong>Pro Tips:</strong>
• Complete profiles get 3x more responses
• Upgrade to Premium for best results
• Use AI suggestions for better matches

What would you like help with?`;
  }
  
  // Default response
  return `I'm here to help you find your perfect match! You can ask me:

• "Find Hindu matches in USA"
• "How to improve my profile?"
• "Explain compatibility score"
• "What are premium benefits?"
• "How to stay safe?"

Or type your specific question and I'll do my best to help! 💝`;
}

/**
 * View Profile
 */
function viewProfile(profileId) {
  window.location.href = `profile.html?id=${profileId}`;
}

/**
 * Send Interest (from dashboard)
 */
function sendInterest(profileId) {
  // In production, this would call the API
  const profiles = {
    1: 'Priya Sharma',
    7: 'Ananya Reddy',
    3: 'Sarah Johnson'
  };
  
  const name = profiles[profileId] || 'this user';
  
  // Show confirmation
  const confirmed = confirm(`Send interest to ${name}?\n\nThey will be notified and can accept or decline.`);
  
  if (confirmed) {
    alert(`💝 Interest sent to ${name}!\n\nYou'll be notified when they respond.`);
  }
}

/**
 * Initialize Dashboard
 */
function initDashboard() {
  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aiModalOpen) {
      closeAIAssistant();
    }
  });
  
  // Close modal on outside click
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('aiAssistantModal');
    const fab = document.querySelector('.ai-assistant-fab');
    
    if (aiModalOpen && modal && !modal.contains(e.target) && !fab.contains(e.target)) {
      closeAIAssistant();
    }
  });
  
  // Animate stats on load
  animateStats();
}

/**
 * Animate Statistics
 */
function animateStats() {
  const statValues = document.querySelectorAll('.stat-value');
  
  statValues.forEach(stat => {
    const finalValue = parseInt(stat.textContent);
    let currentValue = 0;
    const increment = Math.ceil(finalValue / 30);
    
    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= finalValue) {
        currentValue = finalValue;
        clearInterval(timer);
      }
      stat.textContent = currentValue;
    }, 30);
  });
}

/**
 * Animate Compatibility Bars
 */
function animateCompatibilityBars() {
  const bars = document.querySelectorAll('.compat-fill');
  
  bars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0%';
    
    setTimeout(() => {
      bar.style.width = width;
    }, 300);
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  
  // Animate compatibility bars after a delay
  setTimeout(animateCompatibilityBars, 500);
});

// Export functions for global access
window.openAIAssistant = openAIAssistant;
window.closeAIAssistant = closeAIAssistant;
window.handleAIInput = handleAIInput;
window.sendAIMessage = sendAIMessage;
window.askAI = askAI;
window.viewProfile = viewProfile;
window.sendInterest = sendInterest;

