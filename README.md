# ChatSphere

ChatSphere is a full-stack AI-native chat platform built with React, TypeScript, Vite, Express, MongoDB, Socket.IO, JWT auth, Google OAuth, and a multi-provider backend AI gateway.

## Features

### Solo AI Chat
- Dedicated Solo Chat page (`/chat`) with a three-panel layout: conversation sidebar, main chat area, and a conversation insights panel.
- **Separate API Provider & Model selection** — Users pick an API provider (e.g. Together AI, Groq, Gemini, OpenRouter) and then choose a model from that provider independently. Both selections persist across sessions via localStorage.
- Bottom-docked composer with inline provider/model selectors, file attachment support, grammar suggestions, and AI-powered smart replies.
- Conversation history sidebar with real-time timestamps and delete support.
- Conversation insights panel (summarize, extract tasks, extract decisions) powered by the selected AI model.
- Full message metadata display including provider, model, token usage, processing time, and fallback indicators.

### Room / Group Chat
- Create and join chat rooms with real-time messaging via Socket.IO.
- AI can be triggered in rooms using `@ai` mentions (opt-in interaction model).
- Room insights, pinned messages, polls, member management, typing indicators, and read receipts.
- Report and moderation system for room messages.

### Dashboard
- Overview of recent conversations, rooms, and activity analytics.
- Analytics charts for usage metrics.

### Search
- Full-text search across conversations, rooms, and messages.

### User Management
- JWT access/refresh token authentication with Google OAuth support.
- User profile management, settings, and theme customization.
- Admin dashboard for platform management.
- Password reset flow (forgot password, reset via email).

### AI Capabilities
- **Multi-provider AI gateway** — Supports OpenRouter, Gemini Direct, xAI Grok Direct, Groq Direct, Together AI, and Hugging Face.
- Model discovery via `GET /api/ai/models` with a client-facing `auto` option.
- Smart replies — AI-generated reply suggestions based on conversation context.
- Grammar checking and correction suggestions.
- Sentiment analysis on messages.
- AI memory — extraction, retrieval, and governance across conversations.
- Conversation insights — summaries, task extraction, decision extraction.
- File analysis — Upload images, PDFs, code, and text files for AI analysis.

### UI / UX
- Dark-themed, glassmorphic design with neon-purple/blue accents.
- Responsive layout with collapsible sidebars.
- Smooth animations via Framer Motion.
- Compact, docked composer with inline model controls.
- Markdown rendering with syntax-highlighted code blocks in AI responses.
- User avatar badges and online status indicators.
- Clean navbar with profile dropdown menu.

## Stack

- Frontend: React 18, TypeScript, Vite, Zustand, Framer Motion
- Backend: Express, Mongoose, Socket.IO
- Database: MongoDB
- AI: Multi-provider routing in `backend/services/gemini.js`
- Auth: JWT access/refresh tokens plus Google OAuth

## Local Setup

### Backend

Create `backend/.env` manually because the current repo does not include a checked-in `.env.example` file.

Minimum backend env for AI-enabled local work:

```env
MONGO_URI=mongodb://localhost:27017/chatsphere
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
CLIENT_URL=http://localhost:5173
PORT=3000

OPENROUTER_API_KEY=replace_me
OPENROUTER_DEFAULT_MODEL=openai/gpt-5.4-mini
DEFAULT_AI_MODEL=openai/gpt-5.4-mini

# Optional direct-provider keys
GEMINI_API_KEY=
GROK_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
HUGGINGFACE_API_KEY=
```

Run:

```powershell
cd backend
npm install
npm run dev
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Verification

```powershell
cd frontend
npm run build
```

```powershell
cd ../backend
Get-ChildItem -Path . -Recurse -Filter *.js -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\dist\\' } |
  ForEach-Object { node --check $_.FullName }
```
