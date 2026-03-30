import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, User, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';
import { getChatbotResponse } from '@/lib/chatbot';
import DOMPurify from 'dompurify';

// Sanitize text to prevent XSS from localStorage content
const sanitize = (text) => (typeof text === 'string' ? DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) : '');

// Simple markdown to JSX renderer for chat messages
const renderMarkdown = (text) => {
  if (!text) return text;
  text = sanitize(text);
  // Split by line, then process inline formatting
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Process inline markdown: **bold**, *italic*, [link](url)
    const parts = [];
    let remaining = line;
    let key = 0;
    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Link: [text](url)
      const linkMatch = remaining.match(/\[(.+?)\]\((https?:\/\/.+?)\)/);

      // Find which match comes first
      const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
      const linkIdx = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity;

      if (boldIdx === Infinity && linkIdx === Infinity) {
        parts.push(remaining);
        break;
      }

      if (boldIdx <= linkIdx && boldMatch) {
        parts.push(remaining.slice(0, boldIdx));
        parts.push(<strong key={`b${key++}`} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldIdx + boldMatch[0].length);
      } else if (linkMatch) {
        parts.push(remaining.slice(0, linkIdx));
        parts.push(
          <a key={`l${key++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            className="underline hover:opacity-80">{linkMatch[1]}</a>
        );
        remaining = remaining.slice(linkIdx + linkMatch[0].length);
      }
    }
    return (
      <span key={i}>
        {i > 0 && <br />}
        {parts}
      </span>
    );
  });
};

const CHAT_KEY = 'portfolio-chat';

const getVisitorId = () => {
  let visitorId = localStorage.getItem('portfolio-visitor-id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('portfolio-visitor-id', visitorId);
  }
  return visitorId;
};

// Get all chat data from localStorage
const getChatData = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || '{"conversations":[]}');
  } catch { return { conversations: [] }; }
};

const saveChatData = (data) => {
  localStorage.setItem(CHAT_KEY, JSON.stringify(data));
  // Dispatch event so admin dashboard updates in real-time
  window.dispatchEvent(new CustomEvent('chat-updated'));
};

// Send email notification when visitor messages
const sendEmailNotification = async (visitorName, visitorEmail, message) => {
  // Try server-side API first (keeps keys hidden)
  try {
    const res = await fetch('/api/chat-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorName, visitorEmail, message }),
    });
    if (res.ok) return true;
  } catch { /* Server API unavailable, fall back to client-side */ }

  // Fallback: Try Web3Forms directly (for local dev or non-Vercel deployments)
  const web3formsKey = localStorage.getItem('web3forms-key') || process.env.REACT_APP_WEB3FORMS_KEY || '';
  if (web3formsKey) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3formsKey,
          subject: `New Chat Message from ${visitorName}`,
          from_name: visitorName,
          email: visitorEmail || 'Not provided',
          message: `Chat message from ${visitorName}:\n\n${message}`,
        }),
      });
      return true;
    } catch { /* Web3Forms failed, try EmailJS */ }
  }

  // Try EmailJS if configured
  const emailjsConfig = {
    serviceId: localStorage.getItem('emailjs-service-id'),
    templateId: localStorage.getItem('emailjs-template-id'),
    publicKey: localStorage.getItem('emailjs-public-key'),
    toEmail: localStorage.getItem('emailjs-to-email') || 'jcabidoy147@gmail.com',
  };

  if (emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey) {
    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailjsConfig.serviceId,
          template_id: emailjsConfig.templateId,
          user_id: emailjsConfig.publicKey,
          template_params: {
            from_name: visitorName,
            from_email: visitorEmail || 'Not provided',
            message: message,
            to_email: emailjsConfig.toEmail,
          },
        }),
      });
      return true;
    } catch (e) {
      console.warn('EmailJS notification failed:', e);
    }
  }

  // Fallback: store notification flag for admin
  const notifications = JSON.parse(localStorage.getItem('portfolio-notifications') || '[]');
  notifications.push({
    type: 'chat',
    from: visitorName,
    email: visitorEmail,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  });
  localStorage.setItem('portfolio-notifications', JSON.stringify(notifications));
  return false;
};

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [unreadAdmin, setUnreadAdmin] = useState(0);
  const messagesEndRef = useRef(null);
  const visitorId = getVisitorId();
  const { isDark } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Restore existing conversation for this visitor
  useEffect(() => {
    const data = getChatData();
    const existing = data.conversations.find(c => c.visitor_id === visitorId && c.status !== 'closed');
    if (existing) {
      setConversationId(existing.id);
      setVisitorName(existing.visitor_name);
      setVisitorEmail(existing.visitor_email || '');
      setMessages(existing.messages || []);
      setShowForm(false);
    }
  }, [visitorId]);

  // Listen for admin replies (cross-tab sync via storage event + same-tab via custom event)
  const refreshMessages = useCallback(() => {
    if (!conversationId) return;
    const data = getChatData();
    const conv = data.conversations.find(c => c.id === conversationId);
    if (conv) {
      setMessages(conv.messages || []);
      // Count unread admin messages
      const adminMsgs = (conv.messages || []).filter(m => m.sender === 'admin' && !m.read_by_visitor);
      setUnreadAdmin(adminMsgs.length);
    }
  }, [conversationId]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CHAT_KEY) refreshMessages();
    };
    const onChatUpdate = () => refreshMessages();

    window.addEventListener('storage', onStorage);
    window.addEventListener('chat-updated', onChatUpdate);

    // Poll every 2 seconds for same-tab updates
    const interval = setInterval(refreshMessages, 2000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('chat-updated', onChatUpdate);
      clearInterval(interval);
    };
  }, [refreshMessages]);

  const initConversation = () => {
    if (!visitorName.trim()) return;

    const data = getChatData();
    const id = 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    const welcomeMsg = {
      id: 'msg_welcome',
      sender: 'admin',
      message: `Hi ${visitorName.split(' ')[0]}! I'm Janica's assistant. I can answer questions about her services, experience, rates, and more. How can I help you today?`,
      timestamp: new Date().toISOString(),
    };

    const newConv = {
      id,
      visitor_id: visitorId,
      visitor_name: visitorName.trim(),
      visitor_email: visitorEmail.trim(),
      status: 'active',
      created_at: new Date().toISOString(),
      last_message: welcomeMsg.message,
      messages: [welcomeMsg],
      unread: 0,
    };

    data.conversations.push(newConv);
    saveChatData(data);

    setConversationId(id);
    setMessages([welcomeMsg]);
    setShowForm(false);
  };

  const [isTyping, setIsTyping] = useState(false);

  // Rate limit: max 10 messages per 2 minutes
  const checkChatRateLimit = useCallback(() => {
    const key = 'chat-msg-timestamps';
    const now = Date.now();
    const window = 2 * 60 * 1000;
    const timestamps = JSON.parse(localStorage.getItem(key) || '[]').filter(ts => now - ts < window);
    if (timestamps.length >= 10) return false;
    timestamps.push(now);
    localStorage.setItem(key, JSON.stringify(timestamps));
    return true;
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;
    if (!checkChatRateLimit()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const msg = {
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      sender: 'visitor',
      message: messageText,
      timestamp: new Date().toISOString(),
      visitor_name: visitorName,
    };

    // Update localStorage
    const data = getChatData();
    const conv = data.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.messages.push(msg);
      conv.last_message = messageText;
      conv.unread = (conv.unread || 0) + 1;
      conv.updated_at = new Date().toISOString();
      saveChatData(data);
    }

    setMessages(prev => [...prev, msg]);

    // Send email notification
    sendEmailNotification(visitorName, visitorEmail, messageText);

    // AI Chatbot auto-reply
    setIsTyping(true);
    try {
      // Get conversation history for context
      const history = (conv?.messages || []).filter(m => m.id !== 'msg_welcome');
      const botReply = await getChatbotResponse(messageText, history);

      // Small delay to feel natural
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

      const replyMsg = {
        id: 'msg_bot_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        sender: 'admin',
        message: botReply,
        timestamp: new Date().toISOString(),
        is_bot: true,
      };

      // Save bot reply to localStorage
      const freshData = getChatData();
      const freshConv = freshData.conversations.find(c => c.id === conversationId);
      if (freshConv) {
        freshConv.messages.push(replyMsg);
        freshConv.last_message = botReply;
        freshConv.updated_at = new Date().toISOString();
        saveChatData(freshData);
      }

      setMessages(prev => [...prev, replyMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Mark admin messages as read when chat is open
  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const data = getChatData();
    const conv = data.conversations.find(c => c.id === conversationId);
    if (conv) {
      let changed = false;
      conv.messages.forEach(m => {
        if (m.sender === 'admin' && !m.read_by_visitor) {
          m.read_by_visitor = true;
          changed = true;
        }
      });
      if (changed) {
        saveChatData(data);
        setUnreadAdmin(0);
      }
    }
  }, [isOpen, conversationId, messages]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-[9999] ${
          isDark
            ? 'bg-[#d9fb06] hover:bg-[#c4e505] text-[#1a1c1b]'
            : 'bg-[#4a6d00] hover:bg-[#3d5c00] text-white'
        }`}
        aria-label="Open chat"
        data-testid="chat-widget-btn"
      >
        <MessageCircle className="w-6 h-6" />
        {(unreadAdmin > 0 || (!showForm && messages.some(m => m.sender === 'admin' && !m.read_by_visitor))) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            !
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-24px)] border rounded-2xl shadow-2xl z-[9999] overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-14' : 'h-[500px]'
      } ${
        isDark
          ? 'bg-[#1a1c1b] border-[#3f4816]'
          : 'bg-white border-[#d4d2ca]'
      }`}
      data-testid="chat-widget"
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isDark
          ? 'bg-[#302f2c] border-[#3f4816]'
          : 'bg-[#f5f4f0] border-[#d4d2ca]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]'
          }`}>
            <MessageCircle className={`w-4 h-4 ${isDark ? 'text-[#1a1c1b]' : 'text-white'}`} />
          </div>
          <div>
            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Chat with Janica</p>
            <p className={`text-xs ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>Usually replies within 24h</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-2 transition-colors ${isDark ? 'text-[#888680] hover:text-white' : 'text-[#6b6964] hover:text-[#1a1c1b]'}`}
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-2 transition-colors ${isDark ? 'text-[#888680] hover:text-white' : 'text-[#6b6964] hover:text-[#1a1c1b]'}`}
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {showForm ? (
            <div className="p-4 h-[calc(100%-56px)] flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-[#3f4816]/50' : 'bg-[#4a6d00]/10'
                }`}>
                  <User className={`w-8 h-8 ${isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]'}`} />
                </div>
                <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Start a conversation</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                  Hi! I'd love to hear from you. Share your details to get started.
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Your name *"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && initConversation()}
                  className={`${
                    isDark
                      ? 'bg-[#302f2c] border-[#3f4816] text-white placeholder:text-[#888680] focus:border-[#d9fb06]'
                      : 'bg-white border-[#d4d2ca] text-[#1a1c1b] placeholder:text-[#6b6964] focus:border-[#4a6d00]'
                  }`}
                />
                <Input
                  type="email"
                  placeholder="Your email (optional)"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && initConversation()}
                  className={`${
                    isDark
                      ? 'bg-[#302f2c] border-[#3f4816] text-white placeholder:text-[#888680] focus:border-[#d9fb06]'
                      : 'bg-white border-[#d4d2ca] text-[#1a1c1b] placeholder:text-[#6b6964] focus:border-[#4a6d00]'
                  }`}
                />
                <Button
                  onClick={initConversation}
                  disabled={!visitorName.trim()}
                  className={`w-full font-semibold ${
                    isDark
                      ? 'bg-[#d9fb06] hover:bg-[#c4e505] text-[#1a1c1b]'
                      : 'bg-[#4a6d00] hover:bg-[#3d5c00] text-white'
                  }`}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="h-[calc(100%-56px-64px)] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                      Send a message to start the conversation!
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={msg.id + '_' + idx}
                    className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.sender === 'visitor'
                          ? isDark
                            ? 'bg-[#d9fb06] text-[#1a1c1b]'
                            : 'bg-[#4a6d00] text-white'
                          : isDark
                            ? 'bg-[#302f2c] text-white'
                            : 'bg-[#f5f4f0] text-[#1a1c1b]'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.sender !== 'visitor' ? renderMarkdown(msg.message) : sanitize(msg.message)}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'visitor'
                          ? isDark ? 'text-[#1a1c1b]/60' : 'text-white/60'
                          : isDark ? 'text-[#888680]' : 'text-[#6b6964]'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`px-4 py-3 rounded-2xl ${
                      isDark ? 'bg-[#302f2c]' : 'bg-[#f5f4f0]'
                    }`}>
                      <div className="flex gap-1.5 items-center">
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-[#888680]' : 'bg-[#6b6964]'}`} style={{ animationDelay: '0ms' }} />
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-[#888680]' : 'bg-[#6b6964]'}`} style={{ animationDelay: '150ms' }} />
                        <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-[#888680]' : 'bg-[#6b6964]'}`} style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className={`p-3 border-t ${isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]'}`}>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className={`flex-1 ${
                      isDark
                        ? 'bg-[#302f2c] border-[#3f4816] text-white placeholder:text-[#888680] focus:border-[#d9fb06]'
                        : 'bg-[#f5f4f0] border-[#d4d2ca] text-[#1a1c1b] placeholder:text-[#6b6964] focus:border-[#4a6d00]'
                    }`}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`px-3 ${
                      isDark
                        ? 'bg-[#d9fb06] hover:bg-[#c4e505] text-[#1a1c1b]'
                        : 'bg-[#4a6d00] hover:bg-[#3d5c00] text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LiveChatWidget;
