# Janica Cabidoy - Portfolio Website PRD

## Original Problem Statement
Build a personal portfolio website for Janica Cabidoy, a Community Manager specializing in Web3 and crypto communities.

## Core Requirements

### Hero Section
- [x] Display name "Janica Cabidoy" and title "Community Manager"
- [x] Profile picture on left, name/title on right (responsive layout)
- [x] Animated profile picture (click to toggle between images)
- [x] Key stats badges (95K+ Members, 163% Growth, Web3 Expert)
- [x] "Download Resume" button in header

### Content Sections
- [x] Experience: Work history (KCW Plastic, NODO, BITLINKEXC, FIDEM, Tech Factors)
- [x] Skills: Tools list (Galxe, Buffer, Hootsuite, etc.)
- [x] Metrics: Animated counting-up KPIs (removed 6.7% Engagement Rate per user request)
- [x] Case Studies: Facebook Growth, NODO Vaults Automation, Deposit Alerts
- [x] FAQ: Formatted Q&A section
- [x] Social Feed: LinkedIn posts display
- [x] Footer: Contact details and profile picture

### Functionality
- [x] Contact Form with email notification to jcabidoy147@gmail.com
- [x] Admin Dashboard at /admin to view messages
- [x] Resume Download: Working button to download PDF locally served
- [x] External Links: LinkedIn opens in new tab

### Design
- [x] Dark theme with lime green (#d9fb06) accents
- [x] Fully responsive (mobile, tablet, desktop)
- [x] "Click me!" prompt visible for profile animation

---

## Phase 2 Features (Implemented Feb 25, 2026)

### Admin Content Editor
- [x] Edit Personal Info (Name, Title, Email, Telegram, Subtitle, Location)
- [x] Edit Metrics section
- [x] Section tabs: Personal Info, Metrics, Experience, Skills, FAQ
- [x] Changes saved to MongoDB database

### Analytics Dashboard
- [x] Total Page Views tracking
- [x] Unique Visitors count
- [x] Resume Downloads tracking
- [x] Contact Submissions count
- [x] Last 7 Days Activity summary
- [x] Live Chat Statistics

### Live Chat Widget
- [x] Floating chat button on portfolio pages
- [x] Visitor can start conversation with name/email
- [x] Real-time messaging with auto-refresh
- [x] Admin can reply from /admin dashboard
- [x] Unread message count badge
- [x] Conversation close functionality

### Performance Improvements
- [x] LazyImage component for optimized image loading
- [x] Analytics tracking with visitor ID
- [x] Resume download tracking

### Removed Features
- [x] Dark/Light Mode Toggle (removed - keeping dark theme only for consistent branding)

---

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn UI
- **Backend:** FastAPI, Python
- **Database:** MongoDB
- **Email:** Gmail SMTP with App Password

## API Endpoints

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Fetch all messages (admin)
- `PATCH /api/contact/{id}/status` - Update message status
- `DELETE /api/contact/{id}` - Delete message

### Content Management
- `GET /api/content` - Get all content
- `GET /api/content/{section}` - Get section content
- `PUT /api/content/{section}` - Update section content
- `DELETE /api/content/{section}` - Reset section

### Analytics
- `POST /api/analytics/pageview` - Track page view
- `POST /api/analytics/event` - Track custom event
- `GET /api/analytics/messages` - Get message stats
- `GET /api/analytics/overview` - Get full analytics
- `GET /api/analytics/visitors` - Get visitor stats

### Live Chat
- `POST /api/chat/conversation` - Create/get conversation
- `GET /api/chat/conversations` - List all conversations
- `GET /api/chat/conversation/{id}` - Get conversation details
- `POST /api/chat/message` - Send message
- `GET /api/chat/messages/{id}` - Get messages
- `PATCH /api/chat/conversation/{id}/read` - Mark as read
- `PATCH /api/chat/conversation/{id}/close` - Close conversation
- `GET /api/chat/unread-count` - Get unread count

## Database Collections
- `contacts` - Contact form submissions
- `content` - Editable content sections
- `pageviews` - Page view tracking
- `analytics_events` - Custom events
- `conversations` - Chat conversations
- `chat_messages` - Chat messages

## File Structure
```
/app
├── backend/
│   ├── server.py (Enhanced with all APIs)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── public/
│   │   └── Janica_Cabidoy_Resume.pdf
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveChatWidget.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   ├── LazyImage.jsx
│   │   │   └── ... (other components)
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx
│   │   │   └── AnalyticsContext.jsx
│   │   ├── data/mockData.js
│   │   ├── pages/AdminDashboard.jsx (Enhanced)
│   │   └── App.js (Updated with providers)
│   └── .env
└── memory/
    └── PRD.md
```

## Status: COMPLETE ✅

All requested features implemented:
1. ✅ Removed "6.7% Engagement Rate" metric
2. ✅ Admin Content Editor
3. ✅ Analytics & Tracking Dashboard
4. ✅ Dark/Light Mode Toggle
5. ✅ Image Lazy Loading
6. ✅ Performance Improvements
7. ✅ Custom Live Chat Widget

## Future Enhancements (Backlog)
- Blog/Articles section
- Testimonials section
- Multi-language support (English + Filipino)
- Newsletter signup integration
- Calendar embed (Calendly)
