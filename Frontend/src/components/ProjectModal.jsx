import { useState } from 'react'

const COLORS = [
  { id: 'violet', value: '#8b5cf6' },
  { id: 'blue',   value: '#3b82f6' },
  { id: 'green',  value: '#10b981' },
  { id: 'amber',  value: '#f59e0b' },
  { id: 'rose',   value: '#f43f5e' },
  { id: 'cyan',   value: '#06b6d4' },
]

export default function ProjectModal({ project = null, onSave, onClose }) {
  const isEdit = !!project
  const [name,    setName]    = useState(project?.name    ?? '')
  const [color,   setColor]   = useState(project?.color   ?? COLORS[0].value)
  const [context, setContext] = useState(project?.sharedContext ?? '')

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, color, sharedContext: context })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal project-modal">

        <div className="modal-header">
          <div className="modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            {isEdit ? 'Edit Project' : 'New Project'}
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body project-modal-body">

          {/* Name */}
          <div className="setting-group">
            <label className="setting-label">Project Name</label>
            <input
              className="setting-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. React App, Python API…"
              autoFocus
            />
          </div>

          {/* Color */}
          <div className="setting-group">
            <label className="setting-label">Color</label>
            <div className="color-swatches">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  className={`color-swatch ${color === c.value ? 'active' : ''}`}
                  style={{ background: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.id}
                >
                  {color === c.value && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Shared context */}
          <div className="setting-group">
            <label className="setting-label">
              Shared Context
              <span className="setting-optional">optional</span>
            </label>
            <textarea
              className="setting-textarea"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder={`Describe the project so every chat in this folder understands it.\n\nExamples:\n• Tech stack and architecture\n• Coding style rules\n• Important constraints\n• Shared knowledge all chats should have`}
              rows={7}
            />
            <p className="setting-hint">
              This text is sent to the AI at the start of every chat in this project — like a shared system prompt.
            </p>
          </div>

        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave} disabled={!name.trim()}>
            {isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>

      </div>
    </div>
  )
}
