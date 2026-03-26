// AI Chatbot powered by Janica's portfolio knowledge base
// Falls back to smart keyword matching if no AI API key is configured

import { getSection } from './contentStore';

const getKnowledgeBase = () => {
  const personalInfo = getSection('personalInfo');
  const experience = getSection('experience');
  const skills = getSection('skills');
  const faqData = getSection('faqData');
  const metrics = getSection('metrics');
  const whyHireMe = getSection('whyHireMe');
  const education = getSection('education');

  return { personalInfo, experience, skills, faqData, metrics, whyHireMe, education };
};

// Build system prompt for AI API
const buildSystemPrompt = () => {
  const kb = getKnowledgeBase();
  const p = kb.personalInfo;

  return `You are Janica's portfolio assistant chatbot. You answer questions about Janica Cabidoy on her behalf in a friendly, professional tone. Keep responses concise (2-4 sentences max unless detailed info is needed). Use emojis sparingly.

ABOUT JANICA:
- Name: ${p.name}
- Title: ${p.title} | ${p.subtitle}
- Location: ${p.location}
- Email: ${p.email}
- Phone: ${p.phone}
- Telegram: ${p.telegram}
- LinkedIn: ${p.linkedin}
- Calendly: ${p.calendly}
- Status: ${p.availability?.status}
- Response Time: ${p.availability?.responseTime}
- Timezone: ${p.availability?.timezone}

EXPERIENCE:
${(kb.experience || []).map(e => `- ${e.role} at ${e.company} (${e.period}): ${e.description}`).join('\n')}

EDUCATION:
- ${kb.education?.degree}, Major in ${kb.education?.major} from ${kb.education?.institution} (${kb.education?.period})

SKILLS:
${(kb.skills || []).map(s => `- ${s.name}: ${s.level}%`).join('\n')}

KEY METRICS:
${(kb.metrics || []).map(m => `- ${m.label}: ${m.value} (${m.description}) - ${m.detail}`).join('\n')}

WHY HIRE JANICA:
${(kb.whyHireMe || []).map(w => `- ${w.title}: ${w.description}`).join('\n')}

FAQ:
${(kb.faqData || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

IMPORTANT RULES:
- Always be helpful and encourage them to book a call or send an email
- If asked about pricing/rate, mention 1,200 USDT/month base rate
- If asked how to contact, share email (${p.email}), Telegram (${p.telegram}), or Calendly link
- If you don't know something specific, suggest they reach out directly
- Never make up information not in the knowledge base
- Refer to Janica in third person ("Janica can..." or "She specializes in...")`;
};

// Call AI API (supports OpenAI-compatible APIs)
const callAI = async (messages) => {
  const apiKey = localStorage.getItem('chatbot-api-key');
  const apiProvider = localStorage.getItem('chatbot-api-provider') || 'openai';

  if (!apiKey) return null;

  const endpoints = {
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
  };

  const models = {
    openai: 'gpt-4o-mini',
    groq: 'llama-3.1-8b-instant',
  };

  try {
    const res = await fetch(endpoints[apiProvider] || endpoints.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: localStorage.getItem('chatbot-model') || models[apiProvider] || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...messages.map(m => ({
            role: m.sender === 'visitor' ? 'user' : 'assistant',
            content: m.message,
          })),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
};

// Smart keyword-based fallback responses
const getSmartResponse = (message, conversationHistory = []) => {
  const kb = getKnowledgeBase();
  const p = kb.personalInfo;
  const msg = message.toLowerCase().trim();

  // Greeting patterns
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|what'?s up|yo|sup)/i.test(msg)) {
    const greetings = [
      `Hi there! Welcome to Janica's portfolio. I'm her assistant bot. How can I help you today? Feel free to ask about her services, experience, or how to get in touch!`,
      `Hello! Thanks for visiting. I can tell you about Janica's community management experience, her rates, skills, or help you get in touch. What would you like to know?`,
      `Hey! Welcome! I'm here to help you learn about Janica and her work. Ask me anything — services, experience, pricing, or how to contact her!`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Contact / How to reach
  if (/contact|reach|email|phone|call|telegram|connect|talk|speak|meet|book|schedule|calendly/i.test(msg)) {
    return `You can reach Janica through:\nEmail: ${p.email}\nTelegram: ${p.telegram}\nBook a call: ${p.calendly}\nPhone: ${p.phone}\n\nShe typically responds within 24 hours!`;
  }

  // Pricing / Rate
  if (/rate|price|cost|charge|fee|budget|afford|how much|pricing|salary|pay/i.test(msg)) {
    return `Janica's base rate is **1,200 USDT per month**. Final pricing may vary depending on the scope of work and complexity of any custom automation or technical builds. Want to discuss your specific needs? Book a call at ${p.calendly}`;
  }

  // Available / Hire / Freelance
  if (/available|hire|freelance|open|looking|accept|taking|project/i.test(msg)) {
    return `Yes! Janica is currently **${p.availability.status}**\n\nShe specializes in community management, social media marketing, and AI automation. Response time is ${p.availability.responseTime}. Ready to discuss your project? Email ${p.email} or book a call at ${p.calendly}`;
  }

  // Experience / Background / Work
  if (/experience|background|work|career|job|history|company|role|portfolio/i.test(msg)) {
    const expList = (kb.experience || []).slice(0, 3).map(e =>
      `• **${e.role}** at ${e.company} (${e.period})`
    ).join('\n');
    return `Janica has extensive experience in community management and social media:\n\n${expList}\n\nShe's managed 95K+ members across Telegram and Discord with 163% community growth. Want more details about any specific role?`;
  }

  // Skills / What can you do
  if (/skill|can (you|she)|what.*do|speciali|expert|good at|strength|capabilit/i.test(msg)) {
    const topSkills = (kb.skills || []).slice(0, 5).map(s => `• ${s.name} (${s.level}%)`).join('\n');
    return `Janica's top skills:\n\n${topSkills}\n\nShe excels in community management, content strategy, AI automation, and Web3/DeFi knowledge. Need someone to grow and manage your community? She's your person!`;
  }

  // Tools
  if (/tool|software|platform|tech|stack|use|program/i.test(msg)) {
    return `Janica uses a comprehensive tech stack:\n\n**Community & Social:** Galxe, Buffer, Hootsuite, Sprout Social, Guild.xyz\n**Support:** Zendesk, Typeform, Zoom\n**Analytics:** Dune, Google Analytics\n**Design:** Canva, CapCut, Photoshop\n**Productivity:** Google Workspace\n\nShe also builds custom AI automation bots!`;
  }

  // Education
  if (/education|school|university|college|degree|study|graduated|major/i.test(msg)) {
    const edu = kb.education;
    return `Janica holds a **${edu?.degree}** with a major in **${edu?.major}** from ${edu?.institution} (${edu?.period}). Her math background gives her strong analytical skills for data-driven community management!`;
  }

  // Results / Metrics / Growth
  if (/result|metric|growth|achievement|accomplish|number|stat|data|proof|roi/i.test(msg)) {
    return `Here are Janica's key results:\n\n**163% Community Growth** — from 36K to 95K members in 5 months\n**75K+ Telegram Members** managed daily\n**20K+ Discord Members** active community\n**60% Spam Reduction** using advanced filters\n**3.9% Campaign CTR** — above industry average\n\nAll backed by real data and case studies!`;
  }

  // AI / Automation / Bot
  if (/ai|automation|bot|automat|custom bot|make\.com/i.test(msg)) {
    return `Yes! Janica designs and deploys custom **AI automation bots** that work 24/7 to:\n\nMonitor community activity\nTrack vault performance & metrics\nSend real-time notifications\nAutomate growth strategies\n\nShe built the NODO Vaults Update Automation and Deposit Alert System. Want a custom bot for your project? Reach out at ${p.email}`;
  }

  // Web3 / Crypto / DeFi
  if (/web3|crypto|defi|blockchain|nft|token|dao|nodo/i.test(msg)) {
    return `Janica has deep **Web3/DeFi expertise** (90% proficiency):\n\n• Community Manager at **NODO** DeFi Protocol — built automated vault tracking & deposit alerts\n• Crypto Community Manager at **BITLINKEXC** — grew communities from scratch\n• Built custom AI bots for DeFi protocols\n\nShe understands the Web3 ecosystem inside and out!`;
  }

  // Why hire / What makes special
  if (/why.*(hire|choose|pick)|what.*special|different|stand out|unique|advantage/i.test(msg)) {
    const reasons = (kb.whyHireMe || []).slice(0, 4).map(w => `**${w.title}**: ${w.description}`).join('\n');
    return `Here's why you should hire Janica:\n\n${reasons}\n\nShe brings a unique blend of community expertise + technical automation + data-driven results!`;
  }

  // Location / Timezone
  if (/location|where|based|timezone|country|city|time zone|philippines/i.test(msg)) {
    return `Janica is based in **${p.location}**\nTimezone: **${p.availability.timezone}**\n\nShe works remotely and is flexible with scheduling across time zones. Response time is ${p.availability.responseTime}.`;
  }

  // Thank you
  if (/thank|thanks|thx|appreciate|helpful|awesome|great|perfect/i.test(msg)) {
    return `You're welcome! If you'd like to work with Janica, here's how to get started:\n\nBook a call: ${p.calendly}\nEmail: ${p.email}\nTelegram: ${p.telegram}\n\nLooking forward to hearing from you!`;
  }

  // Bye
  if (/^(bye|goodbye|see you|later|ciao|take care)/i.test(msg)) {
    return `Thanks for chatting! Don't hesitate to reach out when you're ready to work together. You can always email ${p.email} or book a call at ${p.calendly}. Have a great day!`;
  }

  // Social Media
  if (/social media|content|post|marketing|facebook|tiktok|instagram|linkedin/i.test(msg)) {
    return `Janica is an experienced **Social Media Manager** with proven results:\n\nManaged campaigns reaching **1.6M+ people**\nGenerated **4.3M video views**\nDrove **314K interactions**\n\nShe handles content creation, scheduling, analytics, and growth strategy across all major platforms. She also worked with **FIDEM**, a TikTok & FB influencer!`;
  }

  // Services offered
  if (/service|offer|provide|what do you (do|offer)|package|deliverable/i.test(msg)) {
    return `Janica offers the following services:\n\n**Community Management** — Telegram, Discord, Twitter/X moderation & growth\n**Social Media Marketing** — Content creation, scheduling, analytics\n**AI Automation** — Custom bots, workflow automation, real-time alerts\n**Content Strategy** — Launch updates, educational threads, FAQs, visuals\n**Moderation** — 24/7 spam filtering, scam prevention, member support\n\nAll services can be customized to your needs. Want to discuss? Book a call at ${p.calendly}`;
  }

  // Moderation / Spam
  if (/moderat|spam|scam|filter|ban|kick|troll|toxic|safe/i.test(msg)) {
    return `Janica provides **24/7 community moderation**:\n\n• **60% spam reduction** using advanced filters & custom bots\n• Scam & phishing detection and prevention\n• Automated anti-spam systems for Telegram & Discord\n• Real-time monitoring with alert systems\n• Clear community guidelines & enforcement\n\nShe keeps communities clean and safe!`;
  }

  // Community management specific
  if (/community|manage|telegram|discord|engage|member|grow|onboard/i.test(msg)) {
    return `Janica's **community management** highlights:\n\n• Grew communities from **36K to 95K members** (163% growth)\n• Manages **75K+ Telegram** and **20K+ Discord** members daily\n• Creates engagement strategies, AMAs, events, and campaigns\n• Onboarding flows and welcome sequences\n• Member retention and engagement tracking\n\nNeed someone to scale your community? She's the one!`;
  }

  // Resume / CV / Download
  if (/resume|cv|download|document|pdf/i.test(msg)) {
    return `You can download Janica's resume directly from this website! Click the **"Resume"** button at the top right of the page. It contains her full work history, skills, and qualifications.\n\nWant to discuss in detail? Book a call at ${p.calendly}`;
  }

  // How to start / Get started / Process
  if (/how.*(start|begin|work together|get started|proceed|process|onboard)|next step|getting started/i.test(msg)) {
    return `Getting started with Janica is easy!\n\n**1.** Book a discovery call at ${p.calendly}\n**2.** Discuss your project goals and needs\n**3.** Receive a tailored proposal\n**4.** Start working together!\n\nOr simply email ${p.email} with your project details. She responds within 24 hours.`;
  }

  // Language / Communication
  if (/language|english|tagalog|filipino|speak|communicat/i.test(msg)) {
    return `Janica is fluent in **English** and **Filipino (Tagalog)**. She communicates professionally in English across all platforms — Discord, Telegram, email, and calls. Clear communication is one of her strengths!`;
  }

  // Hours / Availability / Full-time / Part-time
  if (/hours|full.time|part.time|contract|long.term|short.term|commitment|duration|monthly/i.test(msg)) {
    return `Janica is flexible with arrangements:\n\n• **Full-time** or **part-time** community management\n• Monthly retainer contracts\n• Project-based engagements\n• Base rate: **1,200 USDT/month**\n\nTimezone: ${p.availability.timezone} — she works remotely and adapts to your schedule. Let's discuss what works best at ${p.calendly}`;
  }

  // Who are you / About this bot
  if (/who are you|are you (a |an )?(bot|ai|human|real)|what are you/i.test(msg)) {
    return `I'm Janica's portfolio assistant! I'm here to answer your questions about her services, experience, rates, and availability. I can help you with most common questions.\n\nFor anything more specific, I'd recommend reaching out to Janica directly at ${p.email} or booking a call at ${p.calendly}`;
  }

  // Positive affirmation / Interested
  if (/interested|sounds good|i('m| am) (looking|interested|ready)|let'?s do|sign me up|i want|i need/i.test(msg)) {
    return `That's great to hear! Here's how to take the next step:\n\n**Book a call:** ${p.calendly}\n**Email:** ${p.email}\n**Telegram:** ${p.telegram}\n\nJanica will get back to you within 24 hours to discuss your project!`;
  }

  // Case studies / Portfolio / Examples
  if (/case stud|portfolio|example|sample|previous work|past work|show me/i.test(msg)) {
    return `You can view Janica's **case studies** right on this website! Scroll to the "Case Studies" section to see detailed breakdowns of her work including:\n\n• NODO DeFi Protocol — vault automation & community growth\n• BITLINKEXC — crypto community built from scratch\n• Social media campaigns with measurable results\n\nEach case study includes metrics, challenges, and outcomes.`;
  }

  // Default / Unknown — with fuzzy matching attempt
  // Try to find partial keyword matches in FAQ
  const faqMatch = (kb.faqData || []).find(f => {
    const qWords = f.question.toLowerCase().split(/\s+/);
    const msgWords = msg.split(/\s+/);
    const matches = msgWords.filter(w => w.length > 3 && qWords.some(qw => qw.includes(w) || w.includes(qw)));
    return matches.length >= 2;
  });
  if (faqMatch) {
    return faqMatch.answer;
  }

  const defaults = [
    `Great question! I might not have the specific answer, but Janica would love to help directly. Reach out at ${p.email} or book a call at ${p.calendly}`,
    `I'm not sure about that specific detail, but Janica can definitely answer! Contact her at ${p.email} or via Telegram ${p.telegram}`,
    `That's a good one! For detailed questions, I'd recommend chatting with Janica directly. You can email ${p.email} or schedule a call at ${p.calendly}. She responds within 24 hours!`,
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
};

// Main chatbot function
export const getChatbotResponse = async (message, conversationHistory = []) => {
  // Try AI API first
  const allMessages = [...conversationHistory, { sender: 'visitor', message }];
  const aiResponse = await callAI(allMessages);
  if (aiResponse) return aiResponse;

  // Fallback to smart keyword matching
  return getSmartResponse(message, conversationHistory);
};

export default getChatbotResponse;
