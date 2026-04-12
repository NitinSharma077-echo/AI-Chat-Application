import { useState, useRef, useEffect } from 'react'
import Sidebar       from './components/Sidebar'
import SettingsModal from './components/SettingsModal'
import HelpModal     from './components/HelpModal'
import ProjectModal  from './components/ProjectModal'
import './App.css'

/* ── Theme ───────────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('chat-theme') || 'system')
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    localStorage.setItem('chat-theme', theme)
  }, [theme])
  return [theme, setTheme]
}

function newSession(projectId = null) {
  return { id: crypto.randomUUID(), title: 'New Chat', messages: [], projectId }
}

/* ── Message renderer (handles ``` code blocks) ─────── */
function MessageContent({ content }) {
  const segments = content.split(/(```[\s\S]*?```)/g)
  if (segments.length === 1) return <span className="msg-text">{content}</span>
  return (
    <div className="msg-content">
      {segments.map((seg, i) => {
        const m = seg.match(/^```([^\n]*)\n?([\s\S]*?)```$/)
        if (m) {
          const lang = m[1].trim()
          const code = m[2].replace(/\n$/, '')
          return (
            <div key={i} className="msg-code">
              <div className="msg-code-header">
                <span className="msg-code-lang">{lang || 'code'}</span>
              </div>
              <pre className="msg-code-pre"><code>{code}</code></pre>
            </div>
          )
        }
        return seg ? <span key={i} className="msg-text">{seg}</span> : null
      })}
    </div>
  )
}

/* ── Cursor Bubbles (empty-chat AI effect) ───────────── */
function BubbleCursor({ containerRef }) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let last = 0
    function onMove(e) {
      const now = Date.now()
      if (now - last < 38) return
      last = now

      const b = document.createElement('div')
      b.className = 'cursor-bubble'
      const size = 9 + Math.random() * 24
      const hue  = 248 + Math.random() * 48
      const lit  = 54 + Math.random() * 22
      const alph = 0.13 + Math.random() * 0.28
      const dur  = (0.85 + Math.random() * 0.9).toFixed(2)
      b.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;background:hsla(${hue},65%,${lit}%,${alph});animation-duration:${dur}s`
      document.body.appendChild(b)
      b.addEventListener('animationend', () => b.remove(), { once: true })
    }

    el.addEventListener('mousemove', onMove)
    return () => {
      el.removeEventListener('mousemove', onMove)
      document.querySelectorAll('.cursor-bubble').forEach(b => b.remove())
    }
  }, [containerRef])

  return null
}

/* ══════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [theme, setTheme] = useTheme()

  const [sessions, setSessions] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('chat-sessions') || '[]')
      return s.length > 0 ? s : [newSession()]
    } catch { return [newSession()] }
  })

  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat-projects') || '[]') }
    catch { return [] }
  })

  const [activeId, setActiveId] = useState(() =>
    localStorage.getItem('chat-active-id') || ''
  )

  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [attached, setAttached]   = useState(null)   // { name, content }
  const [toast, setToast]         = useState(null)
  const [chatModel, setChatModel] = useState(() => localStorage.getItem('chat-model') || 'llama3')

  /* Modal / dropdown visibility */
  const [settingsOpen,     setSettingsOpen]     = useState(false)
  const [helpOpen,         setHelpOpen]         = useState(false)
  const [projectModalData, setProjectModalData] = useState(null)
  const [downloadOpen,     setDownloadOpen]     = useState(false)

  const bottomRef      = useRef(null)
  const textareaRef    = useRef(null)
  const fileInputRef   = useRef(null)
  const chatBodyRef    = useRef(null)
  const downloadBtnRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0]
  const messages      = activeSession?.messages ?? []
  const isEmpty       = messages.length === 0
  const canSend       = !loading && (!!input.trim() || !!attached)

  /* ── Persist state ─────────────────────────────────── */
  useEffect(() => { localStorage.setItem('chat-sessions',  JSON.stringify(sessions))  }, [sessions])
  useEffect(() => { localStorage.setItem('chat-projects',  JSON.stringify(projects))  }, [projects])
  useEffect(() => { localStorage.setItem('chat-active-id', activeId)                  }, [activeId])

  /* Restore font size */
  useEffect(() => {
    const fs = localStorage.getItem('chat-fontsize') || '15'
    document.documentElement.style.setProperty('--msg-font-size', fs + 'px')
  }, [])

  /* Auto-scroll */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  /* Toast auto-dismiss */
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  /* Close download dropdown on outside click */
  useEffect(() => {
    if (!downloadOpen) return
    function onOutside(e) {
      if (!downloadBtnRef.current?.contains(e.target)) setDownloadOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [downloadOpen])

  /* ── Helpers ───────────────────────────────────────── */
  function updateSession(id, fn) {
    setSessions(prev => prev.map(s => s.id === id ? fn(s) : s))
  }
  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  /* ── Session ops ───────────────────────────────────── */
  function handleNewChat() {
    const s = newSession()
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
    setInput(''); setAttached(null)
  }
  function handleSelect(id) {
    setActiveId(id)
    setInput(''); setAttached(null)
  }
  function handleDelete(id) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) {
        const s = newSession(); setActiveId(s.id); return [s]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }
  function handleRenameSession(id, newTitle) {
    updateSession(id, s => ({ ...s, title: newTitle }))
  }
  function handleClearAll() {
    const s = newSession()
    setSessions([s]); setActiveId(s.id)
    setInput(''); setAttached(null)
    showToast('All conversations cleared')
  }

  /* ── Project ops ───────────────────────────────────── */
  function handleNewProjectChat(projectId) {
    const s = newSession(projectId)
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
    setInput(''); setAttached(null)
  }
  function handleCreateProject(data) {
    const proj = { id: crypto.randomUUID(), collapsed: false, ...data }
    setProjects(prev => [...prev, proj])
    showToast(`Project "${data.name}" created`)
  }
  function handleEditProject(id, changes) {
    if (changes) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))
    } else {
      const proj = projects.find(p => p.id === id)
      if (proj) setProjectModalData({ mode: 'edit', project: proj })
    }
  }
  function handleDeleteProject(id) {
    setSessions(prev => {
      const toDelete = new Set(prev.filter(s => s.projectId === id).map(s => s.id))
      const next = prev.filter(s => !toDelete.has(s.id))
      if (next.length === 0) {
        const s = newSession(); setActiveId(s.id); return [s]
      }
      if (toDelete.has(activeId)) setActiveId(next[0].id)
      return next
    })
    setProjects(prev => prev.filter(p => p.id !== id))
    showToast('Project deleted')
  }
  function handleToggleProject(id) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, collapsed: !p.collapsed } : p))
  }

  /* ── Upload ────────────────────────────────────────── */
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload  = ev => { setAttached({ name: file.name, content: ev.target.result }); showToast(`📎 ${file.name} attached`) }
    reader.onerror = ()  => showToast('Failed to read file', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  /* ── Shared transcript HTML builder ───────────────── */
  function buildTranscriptHTML() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      || (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const bg      = isDark ? '#13141c' : '#ffffff'
    const textC   = isDark ? '#f1f0f5' : '#0d0b14'
    const textMut = isDark ? '#9ca3af' : '#5c5566'
    const bubbleU = isDark ? '#a78bfa' : '#8b5cf6'
    const bubbleA = isDark ? '#1e1f2a' : '#f3f2f8'
    const border  = isDark ? '#272836' : '#e8e6ec'

    const rows = messages.map(m => {
      const isUser = m.role === 'user'
      const label  = isUser ? 'You' : 'AI'
      const safe   = m.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      return `
      <div style="margin:18px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${isUser?bubbleU:textMut};margin-bottom:6px;padding:0 4px;">${label}</div>
        <div style="padding:12px 16px;border-radius:14px;background:${isUser?bubbleU:bubbleA};color:${isUser?'#fff':textC};font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word;${isUser?'':'border:1px solid '+border+';'}">
          ${safe}
        </div>
      </div>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${activeSession.title}</title>
  <style>
    body { font-family: system-ui, 'Segoe UI', sans-serif; background: ${bg}; color: ${textC}; max-width: 760px; margin: 0 auto; padding: 40px 28px; }
    h1 { font-size: 20px; font-weight: 700; color: ${textC}; border-bottom: 2px solid ${bubbleU}; padding-bottom: 12px; margin: 0 0 28px; }
    .meta { font-size: 12px; color: ${textMut}; margin-bottom: 32px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${activeSession.title}</h1>
  <p class="meta">Exported ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })} · ${messages.length} messages</p>
  ${rows}
</body>
</html>`
  }

  /* ── Download as Markdown ──────────────────────────── */
  function handleDownloadMD() {
    if (!activeSession || messages.length === 0) return
    const body = messages.map(m => `### ${m.role === 'user' ? 'You' : 'AI'}\n\n${m.content}`).join('\n\n---\n\n')
    const blob = new Blob([`# ${activeSession.title}\n\n${body}`], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: `${activeSession.title.slice(0,40).replace(/[^a-z0-9]/gi,'-')}.md`,
    }).click()
    URL.revokeObjectURL(url)
    showToast('Downloaded as Markdown')
    setDownloadOpen(false)
  }

  /* ── Download as HTML ──────────────────────────────── */
  function handleDownloadHTML() {
    if (!activeSession || messages.length === 0) return
    const blob = new Blob([buildTranscriptHTML()], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: `${activeSession.title.slice(0,40).replace(/[^a-z0-9]/gi,'-')}.html`,
    }).click()
    URL.revokeObjectURL(url)
    showToast('Downloaded as HTML')
    setDownloadOpen(false)
  }

  /* ── Download as Word Doc ──────────────────────────── */
  function handleDownloadDoc() {
    if (!activeSession || messages.length === 0) return
    const blob = new Blob([buildTranscriptHTML()], { type: 'application/msword' })
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: `${activeSession.title.slice(0,40).replace(/[^a-z0-9]/gi,'-')}.doc`,
    }).click()
    URL.revokeObjectURL(url)
    showToast('Downloaded as Word document')
    setDownloadOpen(false)
  }

  /* ── Print / Save as PDF ───────────────────────────── */
  function handleDownloadPDF() {
    if (!activeSession || messages.length === 0) return
    const html = buildTranscriptHTML()
    const win  = window.open('', '_blank')
    if (!win) { showToast('Allow pop-ups to save as PDF', 'error'); return }
    win.document.write(html)
    win.document.write(`<script>window.onload=function(){window.print();setTimeout(()=>window.close(),800)}<\/script>`)
    win.document.close()
    showToast('Print dialog opened — choose "Save as PDF"')
    setDownloadOpen(false)
  }

  /* ── Send ──────────────────────────────────────────── */
  async function sendMessage() {
    const text = input.trim()
    if (!canSend) return

    const isFirst   = messages.length === 0
    const sessionId = activeSession.id

    const displayContent = [
      text,
      attached ? `📎 ${attached.name}` : '',
    ].filter(Boolean).join('\n\n')

    const chatContent = text + (attached ? `\n\n[File: ${attached.name}]\n\`\`\`\n${attached.content}\n\`\`\`` : '')

    /* Project shared context */
    const proj = activeSession?.projectId
      ? projects.find(p => p.id === activeSession.projectId)
      : null

    updateSession(sessionId, s => ({
      ...s,
      title: isFirst ? (text || attached?.name || 'New Chat').slice(0, 44) : s.title,
      messages: [...s.messages, { role: 'user', content: displayContent }],
    }))

    setInput(''); setAttached(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat:            chatContent,
          session_id:      sessionId,
          model:           chatModel,
          project_context: proj?.sharedContext || null,
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      updateSession(sessionId, s => ({
        ...s,
        messages: [...s.messages, { role: 'assistant', content: data.reply }],
      }))
    } catch (err) {
      updateSession(sessionId, s => ({
        ...s,
        messages: [...s.messages, { role: 'assistant', content: `⚠ ${err.message}` }],
      }))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="app-layout">
      <Sidebar
        sessions={sessions}
        projects={projects}
        activeId={activeSession?.id}
        open={sidebarOpen}
        theme={theme}
        onNewChat={handleNewChat}
        onNewProjectChat={handleNewProjectChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onRename={handleRenameSession}
        onToggle={() => setSidebarOpen(o => !o)}
        onThemeChange={setTheme}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onCreateProject={() => setProjectModalData({ mode: 'create' })}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onToggleProject={handleToggleProject}
      />

      <div className="chat-pane">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                <IcoMenu />
              </button>
            )}
            <span className="chat-header-title">{activeSession?.title ?? 'New Chat'}</span>
            {(() => {
              const proj = activeSession?.projectId ? projects.find(p => p.id === activeSession.projectId) : null
              return proj ? (
                <span className="header-project-badge">
                  <span className="header-project-dot" style={{ background: proj.color }} />
                  {proj.name}
                </span>
              ) : null
            })()}
          </div>

          <div className="chat-header-right">
            {/* Download dropdown */}
            <div className="download-menu" ref={downloadBtnRef}>
              <button
                className="icon-btn"
                onClick={() => setDownloadOpen(o => !o)}
                disabled={messages.length === 0}
                title="Export conversation"
              >
                <IcoDownload />
              </button>
              {downloadOpen && (
                <div className="download-dropdown">
                  <button className="dl-item" onClick={handleDownloadPDF}>
                    <IcoDlPDF /> <span><strong>PDF</strong> · print / save as PDF</span>
                  </button>
                  <button className="dl-item" onClick={handleDownloadDoc}>
                    <IcoDlDoc /> <span><strong>Word</strong> · .doc file</span>
                  </button>
                  <button className="dl-item" onClick={handleDownloadHTML}>
                    <IcoDlHTML /> <span><strong>HTML</strong> · styled web page</span>
                  </button>
                  <button className="dl-item" onClick={handleDownloadMD}>
                    <IcoDlMD /> <span><strong>Markdown</strong> · plain text</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="chat-body" ref={chatBodyRef}>
          {isEmpty && <BubbleCursor containerRef={chatBodyRef} />}

          {isEmpty && (
            <div className="chat-empty">
              <div className="empty-orb"><IcoSparkle /></div>
              <p className="empty-heading">How can I help you today?</p>
              <p className="empty-sub">Ask anything, attach a file, or start a project.</p>
              <div className="empty-chips">
                {[
                  { label: 'Explain a concept',  fill: 'Explain how ' },
                  { label: 'Write some code',     fill: 'Write a ' },
                  { label: 'Summarize a topic',   fill: 'Summarize ' },
                  { label: 'Help me debug',       fill: 'Help me debug this:\n\n' },
                ].map(({ label, fill }) => (
                  <button
                    key={label}
                    className="empty-chip"
                    onClick={() => {
                      setInput(fill)
                      setTimeout(() => {
                        const ta = textareaRef.current
                        if (!ta) return
                        ta.focus()
                        ta.setSelectionRange(fill.length, fill.length)
                        autoResize()
                      }, 0)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              {msg.role === 'assistant' && <div className="msg-avatar"><IcoBot /></div>}
              <div className={`msg-bubble ${msg.role}`}>
                {msg.content && <MessageContent content={msg.content} />}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row assistant">
              <div className="msg-avatar"><IcoBot /></div>
              <div className="msg-bubble assistant typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Footer */}
        <footer className="chat-footer">
          {attached && (
            <div className="chips-row">
              <div className="file-chip">
                <IcoFile />
                <span className="chip-name">{attached.name}</span>
                <button className="chip-remove" onClick={() => setAttached(null)}><IcoX size={11} /></button>
              </div>
            </div>
          )}

          <div className="input-bar">
            <button className="tool-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
              <IcoPaperclip />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              placeholder="Message AI…"
              disabled={loading}
              rows={1}
              autoFocus
            />

            <button
              className={`send-btn ${loading ? 'loading' : ''}`}
              onClick={sendMessage}
              disabled={!canSend}
              title="Send (Enter)"
            >
              {loading ? <IcoSpinner /> : <IcoSend />}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.py,.js,.ts,.jsx,.tsx,.json,.csv,.html,.css,.xml,.yaml,.yml,.sh,.toml,.env"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </footer>
      </div>

      {/* Modals */}
      {settingsOpen && (
        <SettingsModal
          theme={theme}
          chatModel={chatModel}
          onThemeChange={setTheme}
          onModelChange={m => { setChatModel(m); showToast(`Model set to ${m}`) }}
          onClearAll={handleClearAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {helpOpen && (
        <HelpModal onClose={() => setHelpOpen(false)} />
      )}
      {projectModalData && (
        <ProjectModal
          project={projectModalData.mode === 'edit' ? projectModalData.project : null}
          onSave={data => {
            if (projectModalData.mode === 'create') {
              handleCreateProject(data)
            } else {
              setProjects(prev => prev.map(p =>
                p.id === projectModalData.project.id ? { ...p, ...data } : p
              ))
              showToast('Project updated')
            }
          }}
          onClose={() => setProjectModalData(null)}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════ */
function IcoMenu()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function IcoDownload(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoSparkle() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg> }
function IcoBot()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg> }
function IcoPaperclip(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> }
function IcoSend()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> }
function IcoSpinner() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="spin-icon"><path d="M12 2a10 10 0 0 1 0 20" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> }
function IcoFile()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function IcoX({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
/* Download format icons */
function IcoDlPDF()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function IcoDlDoc()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IcoDlHTML() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
function IcoDlMD()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h6"/></svg> }
