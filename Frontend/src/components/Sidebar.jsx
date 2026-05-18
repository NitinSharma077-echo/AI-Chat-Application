import { useState, useRef, useEffect, useCallback } from 'react'
import logo from '../assets/logo.svg'

/* ══════════════════════════════════════════════════════
   SESSION ITEM  — defined OUTSIDE Sidebar so React
   never remounts it mid-keystroke (fixes focus loss)
══════════════════════════════════════════════════════ */
function SessionItem({
  s, indent,
  isActive, isEditing,
  editValue, editRef,
  setEditValue, commitEdit, handleEditKey,
  startEdit, onSelect, onDelete,
}) {
  return (
    <div
      className={`sb-session${isActive ? ' active' : ''}${indent ? ' indent' : ''}`}
      onClick={() => !isEditing && onSelect(s.id)}
    >
      {indent && <span className="sb-connector" />}
      <span className="sb-session-icon"><IcoChat /></span>

      {isEditing ? (
        <input
          ref={editRef}
          className="sb-edit-input"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleEditKey}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="sb-session-title">{s.title}</span>
      )}

      <div className="sb-actions">
        <button className="sb-action-btn" title="Rename"
          onClick={e => startEdit(e, s.id, s.title, 'session')}>
          <IcoPencil />
        </button>
        <button className="sb-action-btn danger" title="Delete"
          onClick={e => { e.stopPropagation(); onDelete(s.id) }}>
          <IcoTrash />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════ */
export default function Sidebar({
  sessions, projects, activeId, open, theme,
  onNewChat, onNewProjectChat,
  onSelect, onDelete, onRename,
  onToggle, onThemeChange,
  onSettings, onHelp,
  onCreateProject, onEditProject, onDeleteProject, onToggleProject,
  user, onLogout,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editType,  setEditType]  = useState(null)   // 'session' | 'project'
  const [editValue, setEditValue] = useState('')
  const editRef = useRef(null)

  /* Refs so stable callbacks always read the latest values */
  const editingIdRef  = useRef(null)
  const editTypeRef   = useRef(null)
  const editValueRef  = useRef('')
  const onRenameRef   = useRef(onRename)
  const onEditProjRef = useRef(onEditProject)

  editingIdRef.current  = editingId
  editTypeRef.current   = editType
  editValueRef.current  = editValue
  onRenameRef.current   = onRename
  onEditProjRef.current = onEditProject

  /* Focus the input whenever we enter edit mode */
  useEffect(() => {
    if (editingId) editRef.current?.focus()
  }, [editingId])

  /* Stable: start editing a session or project name */
  const startEdit = useCallback((e, id, currentTitle, type) => {
    e.stopPropagation()
    setEditingId(id)
    setEditType(type)
    setEditValue(currentTitle)
  }, [])

  /* Stable: commit the current edit value */
  const doCommitEdit = useCallback(() => {
    const val = editValueRef.current.trim()
    const id  = editingIdRef.current
    const typ = editTypeRef.current
    if (val && id) {
      if (typ === 'session') onRenameRef.current(id, val)
      else if (typ === 'project') onEditProjRef.current(id, { name: val })
    }
    setEditingId(null)
    setEditType(null)
  }, [])

  /* Stable: keyboard handler for edit inputs */
  const handleEditKey = useCallback((e) => {
    if (e.key === 'Enter')  { e.preventDefault(); doCommitEdit() }
    if (e.key === 'Escape') { setEditingId(null); setEditType(null) }
  }, [doCommitEdit])

  /* Build props object for SessionItem */
  function makeSessionProps(s, indent = false) {
    return {
      s, indent,
      isActive:  s.id === activeId,
      isEditing: editingId === s.id && editType === 'session',
      editValue,
      editRef,
      setEditValue,
      commitEdit:    doCommitEdit,
      handleEditKey,
      startEdit,
      onSelect,
      onDelete,
    }
  }

  const standalone = sessions.filter(s => !s.projectId)

  /* ── Render ─────────────────────────────────────────── */
  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>

      {/* Brand header */}
      <div className="sb-header">
        <div className="sb-brand">
          <div className="sb-brand-icon"><img src={logo} alt="AI Chat" className="sb-brand-logo" /></div>
          <span className="sb-brand-name">AI Chat</span>
        </div>
        <button className="sb-icon-btn" onClick={onToggle} title="Collapse sidebar">
          <IcoChevronLeft />
        </button>
      </div>

      {/* New Chat */}
      <div className="sb-new-chat-wrap">
        <button className="sb-new-chat" onClick={onNewChat}>
          <span className="sb-new-chat-plus"><IcoPlus /></span>
          New Chat
        </button>
      </div>

      {/* Scrollable body */}
      <div className="sb-body">

        {/* ── PROJECTS ───────────────────────────────── */}
        <div className="sb-section-row">
          <span className="sb-section-label">Projects</span>
          <button className="sb-section-add" onClick={onCreateProject} title="New project">
            <IcoPlus />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="sb-hint">
            No projects yet.{' '}
            <button className="sb-hint-link" onClick={onCreateProject}>Create one →</button>
          </div>
        ) : (
          <div className="sb-projects">
            {projects.map(proj => {
              const projSessions  = sessions.filter(s => s.projectId === proj.id)
              const isEditingProj = editingId === proj.id && editType === 'project'
              const hasActive     = projSessions.some(s => s.id === activeId)

              return (
                <div key={proj.id} className={`sb-project${hasActive ? ' has-active' : ''}`}>
                  {/* Folder row */}
                  <div className="sb-project-row" onClick={() => onToggleProject(proj.id)}>
                    <span className="sb-project-chevron">
                      <IcoChevron collapsed={proj.collapsed} />
                    </span>

                    <span
                      className="sb-project-dot"
                      style={{ background: proj.color, boxShadow: `0 0 7px ${proj.color}99` }}
                    />

                    {isEditingProj ? (
                      <input
                        ref={editRef}
                        className="sb-edit-input"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={doCommitEdit}
                        onKeyDown={handleEditKey}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="sb-project-name">{proj.name}</span>
                    )}

                    {projSessions.length > 0 && !isEditingProj && (
                      <span className="sb-project-count">{projSessions.length}</span>
                    )}

                    <div className="sb-actions sb-project-actions">
                      <button className="sb-action-btn" title="New chat in project"
                        onClick={e => { e.stopPropagation(); onNewProjectChat(proj.id) }}>
                        <IcoPlus />
                      </button>
                      <button className="sb-action-btn" title="Edit project"
                        onClick={e => { e.stopPropagation(); onEditProject(proj.id) }}>
                        <IcoPencil />
                      </button>
                      <button className="sb-action-btn danger" title="Delete project"
                        onClick={e => { e.stopPropagation(); onDeleteProject(proj.id) }}>
                        <IcoTrash />
                      </button>
                    </div>
                  </div>

                  {/* Nested sessions */}
                  {!proj.collapsed && (
                    <div className="sb-project-body">
                      {projSessions.length === 0 ? (
                        <button className="sb-start-chat"
                          onClick={() => onNewProjectChat(proj.id)}>
                          <IcoPlus /> Start a chat
                        </button>
                      ) : (
                        projSessions.map(s => (
                          <SessionItem key={s.id} {...makeSessionProps(s, true)} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── CHATS ──────────────────────────────────── */}
        <div className="sb-divider" />

        <div className="sb-section-row">
          <span className="sb-section-label">Chats</span>
          {standalone.length > 0 && (
            <span className="sb-count-badge">{standalone.length}</span>
          )}
        </div>

        {standalone.length === 0 ? (
          <div className="sb-hint">No standalone chats yet.</div>
        ) : (
          standalone.map(s => (
            <SessionItem key={s.id} {...makeSessionProps(s, false)} />
          ))
        )}

      </div>

      {/* User profile strip */}
      {user && (
        <div className="sb-user">
          <div className="sb-user-avatar">
            {user.username ? user.username[0] : user.email[0]}
          </div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user.username || 'User'}</div>
            <div className="sb-user-email">{user.email}</div>
          </div>
          <button className="sb-logout-btn" title="Sign out" onClick={onLogout}>
            <IcoLogout />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-theme-label">Theme</div>
        <div className="sb-theme-seg">
          {[
            { key: 'light',  icon: <IcoSun />,    label: 'Light'  },
            { key: 'system', icon: <IcoMonitor />, label: 'Auto'   },
            { key: 'dark',   icon: <IcoMoon />,    label: 'Dark'   },
          ].map(t => (
            <button
              key={t.key}
              className={`sb-theme-btn${theme === t.key ? ' active' : ''}`}
              onClick={() => onThemeChange(t.key)}
              title={t.label}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="sb-nav">
          <button className="sb-nav-btn" onClick={onSettings}>
            <IcoSettings /><span>Settings</span>
          </button>
          <button className="sb-nav-btn" onClick={onHelp}>
            <IcoHelp /><span>Help &amp; Docs</span>
          </button>
        </div>
      </div>

    </aside>
  )
}

/* ══════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════ */
function IcoSparkle()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg> }
function IcoChevronLeft(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function IcoChevron({ collapsed }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
function IcoPlus()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcoChat()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IcoPencil()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IcoTrash()   { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function IcoSun()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
function IcoMoon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> }
function IcoMonitor() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
function IcoSettings(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IcoHelp()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcoLogout()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
