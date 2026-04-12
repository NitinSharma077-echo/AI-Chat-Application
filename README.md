<div align="center">

# AI Chat

**A full-stack AI chat application powered by Ollama, FastAPI, React, and MongoDB.**  
Run local AI models privately — no API keys, no cloud, no data leaving your machine.

![Version](https://img.shields.io/badge/version-1.0.0-8b5cf6?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-local-47a248?style=flat-square&logo=mongodb)
![Ollama](https://img.shields.io/badge/Ollama-local-000000?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## Screenshots

> Place your screenshots inside a `docs/` folder and they will appear here.

| Empty State | Active Conversation |
|---|---|
| ![Empty state](docs/screenshot-empty.png) | ![Chat](docs/screenshot-chat.png) |

| Sidebar — Projects | Settings Modal |
|---|---|
| ![Projects sidebar](docs/screenshot-sidebar.png) | ![Settings](docs/screenshot-settings.png) |

| Light Mode | Dark Mode |
|---|---|
| ![Light](docs/screenshot-light.png) | ![Dark](docs/screenshot-dark.png) |

---

## Features

| | Feature | Description |
|---|---|---|
| 🤖 | **Local AI** | Connects to [Ollama](https://ollama.com) on your machine — zero cloud dependency |
| 🔀 | **Multi-model** | Switch between Llama, Qwen, Gemma, Mistral, Phi, DeepSeek, and more in Settings |
| 📁 | **Projects** | Group chats into folders with a shared system prompt (context) for every session inside |
| 💬 | **Multi-session** | Create, rename, switch, and delete independent conversations from the sidebar |
| 📎 | **File attachments** | Attach `.txt`, `.py`, `.js`, `.json`, `.csv`, `.md` and send content inline |
| ⬇ | **Export chats** | Download any conversation as PDF, Word (.doc), HTML, or Markdown |
| 🖥 | **Code blocks** | Fenced code blocks render with language headers and monospace formatting |
| 🌗 | **Themes** | Light, Dark, and System (follows OS preference) — switchable in sidebar or Settings |
| 🔠 | **Font size** | Adjust message font size (13 – 19 px) with live preview in Settings |
| 💾 | **Persistence** | Sessions and projects saved in `localStorage` (frontend) and MongoDB (backend) |
| ✏ | **Inline rename** | Double-click any chat or project name to rename it directly in the sidebar |
| ✨ | **Bubble cursor** | Subtle particle effect on the empty chat screen |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Inter font |
| **Backend** | FastAPI 0.135, Uvicorn, Pydantic v2, Python 3.12 |
| **AI Engine** | Ollama (local LLM runner — no GPU required for small models) |
| **Database** | MongoDB 6+ (local, via PyMongo) |
| **HTTP** | Python `requests`, Vite dev proxy |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser  (React 19)                         │
│                                                                 │
│  Sidebar               Chat Pane            Modals             │
│  ├─ Projects           ├─ Header            ├─ Settings         │
│  │   └─ Sessions       ├─ Message list      ├─ Project          │
│  ├─ Standalone chats   └─ Input bar         └─ Help             │
│  └─ Theme / Nav                                                 │
│                                                                 │
│       localStorage: sessions, projects, theme, model           │
└──────────────────────────────┬──────────────────────────────────┘
                               │  POST /api/chat
                               │  { chat, session_id,
                               │    model, project_context }
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend  (:8000)                        │
│                                                                 │
│  api/chat.py                                                    │
│  ├─ update_history()  ──►  MongoDB (:27017)                     │
│  └─ generate()        ──►  Ollama  (:11434)  ──►  { response } │
│                                                                 │
│  GET /health  ──►  { status, mongodb }                          │
└─────────────────────────────────────────────────────────────────┘
```

**Request flow:**
1. User types a message and presses **Enter**.
2. React sends `POST /api/chat` with `{ chat, session_id, model, project_context }`.
3. Vite's dev proxy rewrites `/api/*` → `http://localhost:8000/*`.
4. FastAPI stores the user message in MongoDB then builds a prompt from the full session history.
5. If a project is active, the project's shared context is prepended as a system instruction.
6. The prompt is sent to Ollama's `/api/generate`. The response is stored and returned.
7. React appends the new message bubble to the conversation.

---

## Project Structure

```
chat app/
│
├── README.md                          ← You are here
├── docs/                              ← Screenshots for README
│
├── Frontend/                          ← React + Vite frontend
│   ├── index.html                     ← HTML entry (loads Inter font)
│   ├── vite.config.js                 ← Vite config + /api dev proxy
│   ├── package.json                   ← npm dependencies
│   └── src/
│       ├── main.jsx                   ← ReactDOM.createRoot entry point
│       ├── index.css                  ← CSS custom properties / design tokens / theme
│       ├── App.jsx                    ← Root component — all state, logic, layout
│       ├── App.css                    ← All component styles (chat, sidebar, modals)
│       └── components/
│           ├── Sidebar.jsx            ← Project folders, session list, theme switcher
│           ├── SettingsModal.jsx      ← Model browser, font size, theme, danger zone
│           ├── ProjectModal.jsx       ← Create / edit project (name, color, context)
│           ├── HelpModal.jsx          ← Keyboard shortcuts & quick-start guide
│           └── CameraModal.jsx        ← Reserved — vision model image capture
│
└── backend/                           ← FastAPI Python backend
    ├── .env                           ← Local environment variables (not committed)
    ├── requirements.txt               ← Python dependencies
    └── app/
        ├── main.py                    ← FastAPI app, CORS middleware, /health route
        ├── core/
        │   └── config.py              ← Reads .env via python-dotenv
        ├── api/
        │   └── chat.py                ← POST /chat route handler
        ├── db/
        │   └── memory.py              ← MongoDB session CRUD (PyMongo, thread-safe)
        ├── schemas/
        │   └── chat_schema.py         ← Pydantic ChatRequest / ChatResponse models
        └── services/
            └── ai_service.py          ← Builds prompt, calls Ollama /api/generate
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | [nodejs.org](https://nodejs.org) |
| [Python](https://python.org) | 3.11+ | [python.org](https://python.org) |
| [MongoDB](https://www.mongodb.com/try/download/community) | 6+ | Community Edition |
| [Ollama](https://ollama.com/download) | latest | [ollama.com](https://ollama.com/download) |

---

## Installation & Setup

### 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-chat.git
cd "ai-chat/chat app"
```

### 2 — Start MongoDB

```bash
# macOS / Linux (Homebrew)
brew services start mongodb-community

# Windows (run as Administrator)
net start MongoDB

# Or with Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 3 — Install and start Ollama

```bash
# After installing from https://ollama.com/download:
ollama pull llama3          # recommended default (~4 GB)
ollama pull qwen2.5         # fast alternative (~2 GB)
ollama pull deepseek-r1:7b  # reasoning model (~5 GB)
```

Ollama listens on `http://localhost:11434` automatically.

### 4 — Set up the backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env`:

```env
OLLAMA_URL=http://localhost:11434
MODEL_NAME=llama3
MONGODB_URI=mongodb://localhost:27017
DB_NAME=chatapp
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Verify: open `http://localhost:8000/health` — you should see `{ "status": "ok" }`.

### 5 — Set up the frontend

```bash
cd ../Frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Base URL of the Ollama server |
| `MODEL_NAME` | `llama3` | Default model (overridable per-chat in Settings) |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `chatapp` | MongoDB database name |

---

## API Reference

### `POST /chat`

Send a user message and receive an AI reply.

**Request body:**
```json
{
  "chat": "Explain how recursion works",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "model": "llama3",
  "project_context": "You are a Python tutor. Keep answers concise.",
  "images": null
}
```

**Response:**
```json
{
  "reply": "Recursion is when a function calls itself to solve a smaller version of the same problem..."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `chat` | string | ✅ | The user's message text |
| `session_id` | string | ✅ | UUID identifying the conversation |
| `model` | string | optional | Model name override (e.g. `qwen2.5`) |
| `project_context` | string | optional | System-level prefix from the project folder |
| `images` | string[] | optional | Base64 images for vision models |

### `GET /health`

```json
{
  "status": "ok",
  "mongodb": "connected"
}
```

---

## Key Components

### `App.jsx`
Root component holding all application state: sessions, projects, active chat, theme, model, loading, modals, and download. Persists everything to `localStorage`. Contains:
- `sendMessage()` — fetches from `/api/chat`, updates session messages
- `buildTranscriptHTML()` — shared export builder (used by PDF, Word, HTML downloaders)
- `MessageContent` — renders AI responses, splits fenced code blocks
- `BubbleCursor` — particle animation attached to the chat body on empty state

### `Sidebar.jsx`
Two-panel sidebar: **Projects** (collapsible folders with colored dot badges, chat counts, and shared context) and **Chats** (standalone sessions). Inline rename uses stable `useCallback` + ref-based state so React never remounts the input on a keystroke.

### `SettingsModal.jsx`
Model browser grouped by family. Real-time font size preview via CSS custom property (`--msg-font-size`). Danger zone clears all localStorage conversations.

### `ProjectModal.jsx`
Create or edit a project: name, color (6 swatches), and a **Shared Context** textarea. The context is sent as a `system:` prefix in the prompt for every chat in the project.

### `ai_service.py`
Builds a single text prompt from the MongoDB message history, optionally prepends the project context, and calls Ollama's `/api/generate` synchronously with a 120-second timeout.

### `memory.py`
Thread-safe MongoDB client (one instance per process). Each session is one document: `{ session_id, history: [{role, content}], created_at, updated_at }`. Uses `upsert` — first message creates the document automatically.

---

## Using Projects

Projects let you give a group of chats a shared AI persona or context.

1. Click **+** next to **Projects** in the sidebar.
2. Name your project, pick a color, and write a **Shared Context**:
   ```
   You are a senior Python developer.
   Use PEP 8 style, include type hints and docstrings.
   Prefer short, direct answers with code examples.
   ```
3. Click **Create Project**.
4. Click **+** inside the project folder to start a chat — the shared context becomes the AI's system prompt automatically.
5. Edit the context anytime with the pencil icon; changes apply to future messages.

---

## Export Conversations

Click the **↓ download** icon in the chat header (only active when there are messages):

| Format | How it works |
|---|---|
| **PDF** | Opens a styled print dialog — choose "Save as PDF" in your browser |
| **Word (.doc)** | Downloads an HTML file with `.doc` extension that Word / LibreOffice can open |
| **HTML** | Standalone styled web page matching your current theme |
| **Markdown** | Plain `.md` file compatible with any editor or note-taking app |

---

## Supported Models

Pull any model with `ollama pull <id>` before selecting it in Settings:

| Family | Model IDs |
|---|---|
| **Llama** | `llama3`, `llama3.1`, `llama3.2`, `llama2` |
| **Qwen** | `qwen2.5`, `qwen2.5-coder`, `qwen2` |
| **Gemma** | `gemma3`, `gemma2`, `gemma` |
| **Mistral** | `mistral`, `mistral-nemo`, `mixtral` |
| **Phi** | `phi4`, `phi4-mini`, `phi3`, `phi3.5` |
| **DeepSeek** | `deepseek-r1`, `deepseek-r1:7b`, `deepseek-coder-v2` |
| **Vision** | `llava`, `llava-llama3`, `moondream`, `minicpm-v` |
| **Code** | `codellama`, `starcoder2`, `codegemma` |

You can also type any custom model ID directly in the Settings search box.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `Shift + Enter` | Insert new line |
| `Enter` (in rename field) | Save rename |
| `Escape` (in rename field) | Cancel rename |

---

## Development

### Frontend dev server
```bash
cd Frontend
npm run dev       # HMR dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint
```

### Backend dev server
```bash
cd backend
uvicorn app.main:app --reload   # Auto-reload on file change
# Swagger UI: http://localhost:8000/docs
# ReDoc:      http://localhost:8000/redoc
```

---

## Building for Production

```bash
# Build the frontend
cd Frontend && npm run build
# Output: Frontend/dist/

# Serve dist/ via Nginx, Vercel, Netlify, or any static host.
# Configure the static host to proxy /api/* to your deployed backend URL.
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit with a clear message: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request — describe what changed and why

---

## License

MIT — free to use, modify, and distribute.

---

<div align="center">

Built with React, FastAPI, Ollama, and MongoDB.  
**All AI processing happens locally on your machine.**

</div>
