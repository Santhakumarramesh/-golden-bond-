/**
 * Golden Bond - AI Chatbot Routes
 * AI-powered assistant for matchmaking queries
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, optionalAuth, AuthedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Predefined responses for common queries
const AI_RESPONSES: Record<string, string> = {
  greeting: `Hello! 👋 I'm your Golden Bond AI assistant. I can help you with:
• Finding compatible matches
• Understanding compatibility scores
• Improving your profile
• Membership questions
• Safety tips

How can I help you today?`,

  find_matches: `I can help you find matches! Here are some options:

1. **Quick Search**: Use filters like religion, age, location
2. **AI Recommendations**: View your personalized matches on the dashboard
3. **Advanced Search**: Filter by education, profession, lifestyle

Would you like me to explain any of these in detail?`,

  compatibility: `**How Compatibility Scores Work:**

Our AI analyzes multiple factors to calculate your match percentage:

• **Religion & Community (30%)** - Same religion/community scores higher
• **Age Preference (15%)** - Within your preferred range
• **Location (15%)** - Closer locations score higher
• **Languages (15%)** - Common languages you speak
• **Education (10%)** - Similar education levels
• **Lifestyle (15%)** - Diet, habits compatibility

A score of **90%+** is considered excellent!
A score of **75-89%** is a good match.
A score of **60-74%** has potential with some differences.`,

  improve_profile: `**Tips to Improve Your Profile:**

📸 **Photos:**
• Add 3-5 clear, recent photos
• Include a close-up and full-length shot
• Smile! Profiles with smiles get 40% more responses

📝 **Bio:**
• Write about your interests and values
• Mention what you're looking for
• Keep it positive and genuine

✅ **Verification:**
• Verify your phone and email
• Upload ID for trust badge
• Complete video verification for premium trust

🎯 **Preferences:**
• Be specific but not too restrictive
• Update preferences if not getting matches

Complete profiles get **3x more responses**!`,

  premium: `**Golden Bond Premium Benefits:**

🌟 **Gold Plan (₹999/month):**
• View unlimited profiles
• See who viewed you
• Send 30 interests/month
• Priority in search

💎 **Diamond Plan (₹1999/month):**
• All Gold features
• AI-powered match suggestions
• Direct messaging
• Profile boost (2x visibility)

👑 **Elite Plan (₹4999/month):**
• All Diamond features
• Personal matchmaking consultant
• Video verification badge
• VIP 24/7 support
• Featured on homepage

Would you like to upgrade?`,

  safety: `**Safety Tips for Online Matchmaking:**

🔒 **Profile Safety:**
• Look for verified profiles (✓ badge)
• Check trust scores
• Report suspicious behavior

⚠️ **Red Flags to Watch:**
• Asking for money
• Refusing video calls
• Inconsistent information
• Rushing to move off-platform

💡 **Meeting Tips:**
• Video call before meeting
• Meet in public places
• Tell someone where you're going
• Trust your instincts

Need to report someone? Use the Report button on any profile.`,

  how_to_use: `**How to Use Golden Bond:**

1️⃣ **Complete Your Profile**
   Add photos, bio, and preferences

2️⃣ **Search & Filter**
   Use religion, community, location filters

3️⃣ **View AI Matches**
   Check your dashboard for recommendations

4️⃣ **Send Interest**
   Like profiles you're interested in

5️⃣ **Connect**
   Chat with mutual matches (Premium)

6️⃣ **Meet**
   Take it offline when comfortable!

Need help with any step?`
};

/**
 * POST /api/ai/chat
 * Send a message to the AI chatbot
 */
router.post('/chat', optionalAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { message, sessionId, languageCode = 'en' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await prisma.chatbotSession.findUnique({
        where: { id: sessionId }
      });
    }

    if (!session) {
      session = await prisma.chatbotSession.create({
        data: {
          userId: req.userId || null,
          languageCode
        }
      });
    }

    // Save user message
    await prisma.chatbotMessage.create({
      data: {
        sessionId: session.id,
        sender: 'user',
        content: message
      }
    });

    // Generate AI response
    const response = generateResponse(message, req.userId);

    // Save bot response
    await prisma.chatbotMessage.create({
      data: {
        sessionId: session.id,
        sender: 'bot',
        content: response
      }
    });

    res.json({
      sessionId: session.id,
      reply: response
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/ai/session/:sessionId
 * Get chat history for a session
 */
router.get('/session/:sessionId', optionalAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

    const session = await prisma.chatbotSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Only allow access to own sessions
    if (session.userId && session.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      sessionId: session.id,
      messages: session.messages.map(m => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.createdAt
      }))
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * POST /api/ai/suggest-matches
 * AI-powered match suggestions based on natural language query
 */
router.post('/suggest-matches', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    // Parse the natural language query
    const filters = parseMatchQuery(query);

    // Build search criteria
    const where: any = {
      profileStatus: 'APPROVED',
      userId: { not: req.userId }
    };

    if (filters.religion) where.religion = filters.religion;
    if (filters.country) where.country = filters.country;
    if (filters.gender) where.gender = filters.gender;
    if (filters.maritalStatus) where.maritalStatus = filters.maritalStatus;

    // Age filter
    if (filters.ageMin || filters.ageMax) {
      const now = new Date();
      const minAge = filters.ageMin || 18;
      const maxAge = filters.ageMax || 80;
      
      where.dob = {
        gte: new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate()),
        lte: new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate())
      };
    }

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1
        }
      },
      take: 10,
      orderBy: { trustScore: 'desc' }
    });

    const response = profiles.length > 0
      ? `I found ${profiles.length} matches based on your query! Here are the top results:`
      : `I couldn't find exact matches for "${query}". Try broadening your criteria.`;

    res.json({
      response,
      profiles: profiles.map(p => ({
        id: p.id,
        firstName: p.firstName,
        age: calculateAge(p.dob),
        religion: p.religion,
        community: p.community,
        country: p.country,
        profession: p.profession,
        photo: p.photos[0]?.url || null
      })),
      filters
    });

  } catch (error) {
    console.error('Suggest matches error:', error);
    res.status(500).json({ error: 'Failed to suggest matches' });
  }
});

/**
 * Generate AI response based on user message
 */
function generateResponse(message: string, userId?: number): string {
  const msg = message.toLowerCase();

  // Greeting detection
  if (msg.match(/^(hi|hello|hey|namaste|good morning|good evening)/)) {
    return AI_RESPONSES.greeting;
  }

  // Find matches
  if (msg.includes('find') && (msg.includes('match') || msg.includes('partner'))) {
    return AI_RESPONSES.find_matches;
  }

  // Religion-specific search
  if (msg.includes('hindu') || msg.includes('muslim') || msg.includes('christian') || 
      msg.includes('sikh') || msg.includes('jain') || msg.includes('buddhist')) {
    const religion = extractReligion(msg);
    return `I can help you find ${religion} matches! 

Go to the **Search** page and select "${religion}" in the Religion filter. Or check your **Dashboard** for AI-recommended ${religion} profiles.

Would you like tips on improving your compatibility with ${religion} matches?`;
  }

  // Compatibility questions
  if (msg.includes('compatibility') || msg.includes('score') || msg.includes('match %') || 
      msg.includes('percentage')) {
    return AI_RESPONSES.compatibility;
  }

  // Profile improvement
  if (msg.includes('improve') || msg.includes('profile') || msg.includes('better') ||
      msg.includes('more matches') || msg.includes('no response')) {
    return AI_RESPONSES.improve_profile;
  }

  // Premium/membership
  if (msg.includes('premium') || msg.includes('upgrade') || msg.includes('paid') ||
      msg.includes('membership') || msg.includes('plan') || msg.includes('price')) {
    return AI_RESPONSES.premium;
  }

  // Safety
  if (msg.includes('safe') || msg.includes('fake') || msg.includes('scam') ||
      msg.includes('report') || msg.includes('block') || msg.includes('suspicious')) {
    return AI_RESPONSES.safety;
  }

  // How to use
  if (msg.includes('how') || msg.includes('help') || msg.includes('use') ||
      msg.includes('start') || msg.includes('guide')) {
    return AI_RESPONSES.how_to_use;
  }

  // Second marriage specific
  if (msg.includes('second marriage') || msg.includes('divorced') || msg.includes('widowed')) {
    return `Golden Bond welcomes everyone looking for love, including those seeking a second marriage.

**Tips for Second Marriage Seekers:**
• Be honest about your marital status
• Mention children if applicable
• Focus on what you're looking for now
• Use the marital status filter to find similar profiles

Many successful matches happen for second marriages. Your past doesn't define your future! 💝`;
  }

  // Default response
  return `I'm here to help you find your perfect match! You can ask me about:

• **"Find Hindu matches in India"**
• **"How to improve my profile?"**
• **"Explain compatibility score"**
• **"What are premium benefits?"**
• **"How to stay safe?"**

Or type your specific question and I'll do my best to help! 💝`;
}

/**
 * Extract religion from message
 */
function extractReligion(message: string): string {
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Parsi'];
  
  for (const religion of religions) {
    if (message.toLowerCase().includes(religion.toLowerCase())) {
      return religion;
    }
  }
  
  return 'compatible';
}

/**
 * Parse natural language match query
 */
function parseMatchQuery(query: string): Record<string, any> {
  const filters: Record<string, any> = {};
  const q = query.toLowerCase();

  // Extract religion
  const religions = ['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'jewish'];
  for (const religion of religions) {
    if (q.includes(religion)) {
      filters.religion = religion.charAt(0).toUpperCase() + religion.slice(1);
      break;
    }
  }

  // Extract country
  const countries = ['india', 'usa', 'uk', 'canada', 'australia', 'uae', 'singapore'];
  for (const country of countries) {
    if (q.includes(country)) {
      filters.country = country === 'usa' ? 'United States' : 
                       country === 'uk' ? 'United Kingdom' :
                       country === 'uae' ? 'United Arab Emirates' :
                       country.charAt(0).toUpperCase() + country.slice(1);
      break;
    }
  }

  // Extract age range
  const ageMatch = q.match(/(\d{2})\s*[-–to]\s*(\d{2})/);
  if (ageMatch) {
    filters.ageMin = parseInt(ageMatch[1], 10);
    filters.ageMax = parseInt(ageMatch[2], 10);
  }

  // Extract gender
  if (q.includes('women') || q.includes('female') || q.includes('girl') || q.includes('bride')) {
    filters.gender = 'FEMALE';
  } else if (q.includes('men') || q.includes('male') || q.includes('boy') || q.includes('groom')) {
    filters.gender = 'MALE';
  }

  // Extract marital status
  if (q.includes('never married') || q.includes('unmarried')) {
    filters.maritalStatus = 'NEVER_MARRIED';
  } else if (q.includes('divorced')) {
    filters.maritalStatus = 'DIVORCED';
  } else if (q.includes('widowed')) {
    filters.maritalStatus = 'WIDOWED';
  } else if (q.includes('second marriage')) {
    filters.maritalStatus = { in: ['DIVORCED', 'WIDOWED'] };
  }

  return filters;
}

/**
 * Calculate age from DOB
 */
function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

export default router;

