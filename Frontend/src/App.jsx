import { useState, useRef, useEffect } from 'react'
import { api }            from './api'
import { useTheme }       from './hooks/useTheme'
import { useDownload }    from './hooks/useDownload'
import Sidebar            from './components/Sidebar'
import AuthPage           from './components/AuthPage'
import ChatHeader         from './components/ChatHeader'
import ChatBody           from './components/ChatBody'
import ChatInput          from './components/ChatInput'
import SettingsModal      from './components/SettingsModal'
import HelpModal          from './components/HelpModal'
import ProjectModal       from './components/ProjectModal'
import './App.css'

export default function App() {
  const [theme, setTheme] = useTheme()

  /* ── Auth ──────────────────────────────────────────── */
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat-user') || 'null') }
    catch { return null }
  })

  /* ── Data ──────────────────────────────────────────── */
  const [sessions,        setSessions]        = useState([])
  const [projects,        setProjects]        = useState([])
  const [messages,        setMessages]        = useState([])
  const [activeId,        setActiveId]        = useState(null)
  const [dataLoading,     setDataLoading]     = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)

  /* ── UI ────────────────────────────────────────────── */
  const [input,            setInput]            = useState('')
  const [loading,          setLoading]          = useState(false)
  const [sidebarOpen,      setSidebarOpen]      = useState(true)
  const [attached,         setAttached]         = useState(null)
  const [toast,            setToast]            = useState(null)
  const [chatModel,        setChatModel]        = useState(() => {
    const m = localStorage.getItem('chat-model')
    return (!m || m === 'llama3') ? 'qwen2.5:1.5b' : m
  })
  const [settingsOpen,     setSettingsOpen]     = useState(false)
  const [helpOpen,         setHelpOpen]         = useState(false)
  const [projectModalData, setProjectModalData] = useState(null)

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const chatBodyRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId) ?? null
  const isEmpty       = messages.length === 0 && !messagesLoading
  const canSend       = !loading && !messagesLoading && (!!input.trim() || !!attached)

  /* ── Download handlers ─────────────────────────────── */
  const { handleDownloadMD, handleDownloadHTML, handleDownloadDoc, handleDownloadPDF } =
    useDownload({ activeSession, messages, showToast })

  /* ── Effects ───────────────────────────────────────── */
  useEffect(() => { if (user) loadData() }, [user])

  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    loadMessages(activeId)
  }, [activeId])

  useEffect(() => {
    const fs = localStorage.getItem('chat-fontsize') || '15'
    document.documentElement.style.setProperty('--msg-font-size', fs + 'px')
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  /* ── Data loaders ──────────────────────────────────── */
  async function loadData() {
    setDataLoading(true)
    try {
      const [sessRes, projRes] = await Promise.all([api.getSessions(), api.getProjects()])
      if (!sessRes.ok || !projRes.ok) throw new Error()
      const [sessData, projData] = await Promise.all([sessRes.json(), projRes.json()])
      setSessions(sessData)
      setProjects(projData)
      if (sessData.length > 0) setActiveId(sessData[0].id)
    } catch {
      showToast('Could not load data. Is the backend running?', 'error')
    } finally {
      setDataLoading(false)
    }
  }

  async function loadMessages(sessionId) {
    setMessagesLoading(true)
    setMessages([])
    try {
      const res = await api.getMessages(sessionId)
      if (res.ok) setMessages(await res.json())
    } catch { /* silently fail */ }
    finally { setMessagesLoading(false) }
  }

  /* ── Helpers ───────────────────────────────────────── */
  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  /* ── Auth handlers ─────────────────────────────────── */
  function handleAuth(u) { setUser(u) }

  function handleLogout() {
    localStorage.removeItem('chat-token')
    localStorage.removeItem('chat-refresh-token')
    localStorage.removeItem('chat-user')
    setUser(null); setSessions([]); setProjects([])
    setMessages([]); setActiveId(null)
  }

  /* ── Session handlers ──────────────────────────────── */
  async function handleNewChat() {
    const id = crypto.randomUUID()
    await api.createSession({ session_id: id, title: 'New Chat' })
    setSessions(prev => [{ id, title: 'New Chat', projectId: null }, ...prev])
    setActiveId(id); setMessages([]); setInput(''); setAttached(null)
  }

  function handleSelect(id) {
    if (id === activeId) return
    setActiveId(id); setInput(''); setAttached(null)
  }

  async function handleDelete(id) {
    await api.deleteSession(id)
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (id === activeId) {
        if (next.length > 0) setActiveId(next[0].id)
        else { setActiveId(null); setMessages([]) }
      }
      return next
    })
  }

  async function handleRenameSession(id, newTitle) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s))
    await api.renameSession(id, newTitle)
  }

  async function handleClearAll() {
    await Promise.all(sessions.map(s => api.deleteSession(s.id)))
    await Promise.all(projects.map(p => api.deleteProject(p.id)))
    setSessions([]); setProjects([]); setMessages([]); setActiveId(null)
    showToast('All conversations cleared')
  }

  /* ── Project handlers ──────────────────────────────── */
  async function handleNewProjectChat(projectId) {
    const id = crypto.randomUUID()
    await api.createSession({ session_id: id, title: 'New Chat', project_id: projectId })
    setSessions(prev => [{ id, title: 'New Chat', projectId }, ...prev])
    setActiveId(id); setMessages([]); setInput(''); setAttached(null)
  }

  async function handleCreateProject(data) {
    const id  = crypto.randomUUID()
    const res = await api.createProject({
      project_id: id, name: data.name, color: data.color,
      shared_context: data.sharedContext || '',
    })
    if (res.ok) {
      const proj = await res.json()
      setProjects(prev => [...prev, proj])
      showToast(`Project "${data.name}" created`)
    }
  }

  async function handleEditProject(id, changes) {
    if (changes) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))
      await api.updateProject(id, { name: changes.name, color: changes.color, shared_context: changes.sharedContext })
    } else {
      const proj = projects.find(p => p.id === id)
      if (proj) setProjectModalData({ mode: 'edit', project: proj })
    }
  }

  async function handleDeleteProject(id) {
    await api.deleteProject(id)
    setSessions(prev => {
      const toDelete = new Set(prev.filter(s => s.projectId === id).map(s => s.id))
      const next     = prev.filter(s => !toDelete.has(s.id))
      if (toDelete.has(activeId)) {
        if (next.length > 0) setActiveId(next[0].id)
        else { setActiveId(null); setMessages([]) }
      }
      return next
    })
    setProjects(prev => prev.filter(p => p.id !== id))
    showToast('Project deleted')
  }

  async function handleToggleProject(id) {
    const proj = projects.find(p => p.id === id)
    if (!proj) return
    const collapsed = !proj.collapsed
    setProjects(prev => prev.map(p => p.id === id ? { ...p, collapsed } : p))
    api.updateProject(id, { collapsed })
  }

  /* ── File upload ───────────────────────────────────── */
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload  = ev => { setAttached({ name: file.name, content: ev.target.result }); showToast(`📎 ${file.name} attached`) }
    reader.onerror = ()  => showToast('Failed to read file', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  /* ── Send message ──────────────────────────────────── */
  async function sendMessage() {
    const text = input.trim()
    if (!canSend || !activeId) return

    const sessionId = activeId
    const isFirst   = messages.length === 0
    const proj      = activeSession?.projectId ? projects.find(p => p.id === activeSession.projectId) : null

    const displayContent = [text, attached ? `📎 ${attached.name}` : ''].filter(Boolean).join('\n\n')
    const chatContent    = text + (attached ? `\n\n[File: ${attached.name}]\n\`\`\`\n${attached.content}\n\`\`\`` : '')

    setMessages(prev => [...prev, { role: 'user', content: displayContent }])
    setInput(''); setAttached(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    if (isFirst) {
      const newTitle = (text || attached?.name || 'New Chat').slice(0, 44)
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s))
      api.renameSession(sessionId, newTitle).catch(() => {})
    }

    try {
      const res = await api.chat({
        chat: chatContent, session_id: sessionId,
        model: chatModel, project_context: proj?.sharedContext || null,
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  /* ── Chip click (starter prompts) ──────────────────── */
  function handleChipClick(fill) {
    setInput(fill)
    setTimeout(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      ta.setSelectionRange(fill.length, fill.length)
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }, 0)
  }

  /* ── Auth gate ─────────────────────────────────────── */
  if (!user) return <AuthPage onAuth={handleAuth} />

  if (dataLoading) {
    return (
      <div className="app-init-loading">
        <div className="init-spinner" />
        <p>Loading your chats…</p>
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="app-layout">
      <Sidebar
        sessions={sessions}    projects={projects}
        activeId={activeId}    open={sidebarOpen}
        theme={theme}          user={user}
        onNewChat={handleNewChat}
        onNewProjectChat={handleNewProjectChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onRename={handleRenameSession}
        onToggle={() => setSidebarOpen(o => !o)}
        onThemeChange={setTheme}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onLogout={handleLogout}
        onCreateProject={() => setProjectModalData({ mode: 'create' })}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onToggleProject={handleToggleProject}
      />

      <div className="chat-pane">
        <ChatHeader
          activeSession={activeSession}
          projects={projects}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          messages={messages}
          onDownloadPDF={handleDownloadPDF}
          onDownloadDoc={handleDownloadDoc}
          onDownloadHTML={handleDownloadHTML}
          onDownloadMD={handleDownloadMD}
        />

        <ChatBody
          messages={messages}
          loading={loading}
          messagesLoading={messagesLoading}
          isEmpty={isEmpty}
          activeId={activeId}
          user={user}
          chatBodyRef={chatBodyRef}
          bottomRef={bottomRef}
          onChipClick={handleChipClick}
        />

        <ChatInput
          activeId={activeId}
          input={input}
          setInput={setInput}
          attached={attached}
          setAttached={setAttached}
          loading={loading}
          messagesLoading={messagesLoading}
          canSend={canSend}
          onSend={sendMessage}
          textareaRef={textareaRef}
          onFileSelect={handleFileSelect}
        />
      </div>

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          chatModel={chatModel}
          onThemeChange={setTheme}
          onModelChange={m => { setChatModel(m); localStorage.setItem('chat-model', m); showToast(`Model set to ${m}`) }}
          onClearAll={handleClearAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {projectModalData && (
        <ProjectModal
          project={projectModalData.mode === 'edit' ? projectModalData.project : null}
          onSave={async data => {
            if (projectModalData.mode === 'create') {
              await handleCreateProject(data)
            } else {
              const id = projectModalData.project.id
              setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
              await api.updateProject(id, { name: data.name, color: data.color, shared_context: data.sharedContext || '' })
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
