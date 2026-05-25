import { useState, useEffect } from 'react'

/* ── Model catalogue ─────────────────────────────────── */
const MODEL_GROUPS = [
  {
    label: 'Llama',
    models: [
      { id: 'llama3.2',     label: 'Llama 3.2'     },
      { id: 'llama3.1',     label: 'Llama 3.1'     },
      { id: 'llama3',       label: 'Llama 3'        },
      { id: 'llama2',       label: 'Llama 2'        },
    ],
  },
  {
    label: 'Qwen',
    models: [
      { id: 'qwen2.5:latest',   label: 'Qwen 2.5 (Latest)' },
      { id: 'qwen2.5:1.5b',     label: 'Qwen 2.5 (1.5B)'   },
      { id: 'qwen2.5-coder',    label: 'Qwen 2.5 Coder', badge: 'code' },
      { id: 'qwen2',            label: 'Qwen 2'          },
      { id: 'qwen',             label: 'Qwen'            },
    ],
  },
  {
    label: 'Gemma',
    models: [
      { id: 'gemma3',   label: 'Gemma 3'  },
      { id: 'gemma2',   label: 'Gemma 2'  },
      { id: 'gemma',    label: 'Gemma'    },
    ],
  },
  {
    label: 'Mistral',
    models: [
      { id: 'mistral',        label: 'Mistral'        },
      { id: 'mistral-nemo',   label: 'Mistral Nemo'   },
      { id: 'mistral-small',  label: 'Mistral Small'  },
      { id: 'mixtral',        label: 'Mixtral 8x7B'   },
    ],
  },
  {
    label: 'Phi',
    models: [
      { id: 'phi4',       label: 'Phi 4'      },
      { id: 'phi4-mini',  label: 'Phi 4 Mini' },
      { id: 'phi3',       label: 'Phi 3'      },
      { id: 'phi3.5',     label: 'Phi 3.5'    },
    ],
  },
  {
    label: 'DeepSeek',
    models: [
      { id: 'deepseek-r1',          label: 'DeepSeek R1'        },
      { id: 'deepseek-r1:7b',       label: 'DeepSeek R1 7B'     },
      { id: 'deepseek-coder-v2',    label: 'DeepSeek Coder V2', badge: 'code' },
    ],
  },
  {
    label: 'Vision',
    models: [
      { id: 'llava',          label: 'LLaVA',           badge: 'vision' },
      { id: 'llava-llama3',   label: 'LLaVA Llama 3',   badge: 'vision' },
      { id: 'moondream',      label: 'Moondream',        badge: 'vision' },
      { id: 'minicpm-v',      label: 'MiniCPM-V',        badge: 'vision' },
      { id: 'llava-phi3',     label: 'LLaVA Phi 3',      badge: 'vision' },
    ],
  },
  {
    label: 'Code',
    models: [
      { id: 'codellama',    label: 'Code Llama',   badge: 'code' },
      { id: 'starcoder2',   label: 'StarCoder 2',  badge: 'code' },
      { id: 'codegemma',    label: 'CodeGemma',    badge: 'code' },
    ],
  },
  {
    label: 'Other',
    models: [
      { id: 'neural-chat',  label: 'Neural Chat'  },
      { id: 'vicuna',       label: 'Vicuna'        },
      { id: 'orca-mini',    label: 'Orca Mini'     },
      { id: 'dolphin-mixtral', label: 'Dolphin Mixtral' },
    ],
  },
]

const BADGE_STYLE = {
  vision: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'vision' },
  code:   { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'code'   },
}

/* ════════════════════════════════════════════════════════ */

export default function SettingsModal({
  theme, chatModel,
  onThemeChange, onModelChange, onClearAll, onClose,
}) {
  const [model,    setModel]    = useState(chatModel)
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('chat-fontsize') || '15')
  const [dirty,    setDirty]    = useState(false)
  const [search,   setSearch]   = useState('')

  /* Live font-size preview */
  useEffect(() => {
    document.documentElement.style.setProperty('--msg-font-size', fontSize + 'px')
  }, [fontSize])

  const originalFontSize = localStorage.getItem('chat-fontsize') || '15'

  function handleClose() {
    document.documentElement.style.setProperty('--msg-font-size', originalFontSize + 'px')
    onClose()
  }

  function handleSave() {
    localStorage.setItem('chat-model',    model.trim())
    localStorage.setItem('chat-fontsize', fontSize)
    onModelChange(model.trim())
    onClose()
  }

  function handleClear() {
    if (window.confirm('Delete all conversations? This cannot be undone.')) {
      onClearAll()
      onClose()
    }
  }

  function pickModel(id) {
    setModel(id)
    setDirty(true)
    setSearch('')
  }

  /* Filter groups by search */
  const query = search.toLowerCase()
  const filtered = query
    ? MODEL_GROUPS.map(g => ({
        ...g,
        models: g.models.filter(m =>
          m.id.includes(query) || m.label.toLowerCase().includes(query)
        ),
      })).filter(g => g.models.length > 0)
    : MODEL_GROUPS

  const themeOptions = [
    { key: 'light',  label: 'Light',  icon: '☀' },
    { key: 'system', label: 'System', icon: '💻' },
    { key: 'dark',   label: 'Dark',   icon: '🌙' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal settings-modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </div>
          <button className="modal-close" onClick={handleClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body settings-body">

          {/* ── AI Model ── */}
          <div className="setting-group">
            <label className="setting-label">AI Model</label>

            {/* Selected model display */}
            <div className="model-selected">
              <span className="model-selected-name">{model || 'None selected'}</span>
              {model && (
                <button
                  className="model-clear-btn"
                  onClick={() => { setModel(''); setDirty(true) }}
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search */}
            <input
              className="setting-input model-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models or type a custom name…"
              spellCheck={false}
            />

            {/* Model grid */}
            <div className="model-browser">
              {filtered.map(group => (
                <div key={group.label} className="model-group">
                  <div className="model-group-label">{group.label}</div>
                  <div className="model-grid">
                    {group.models.map(m => {
                      const isActive = model === m.id
                      const badge    = m.badge ? BADGE_STYLE[m.badge] : null
                      return (
                        <button
                          key={m.id}
                          className={`model-chip ${isActive ? 'active' : ''}`}
                          onClick={() => pickModel(m.id)}
                          title={`ollama pull ${m.id}`}
                        >
                          <span className="model-chip-label">{m.label}</span>
                          {badge && (
                            <span
                              className="model-badge"
                              style={{ background: badge.bg, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          )}
                          {isActive && (
                            <span className="model-check">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="model-no-results">
                  No match — your input above will be used as the model name.
                </p>
              )}
            </div>

            <p className="setting-hint">
              The model must be pulled in Ollama first: <code>ollama pull {model || 'qwen2.5:1.5b'}</code>.
              Vision-tagged models support the camera feature.
            </p>
          </div>

          {/* ── Font size ── */}
          <div className="setting-group">
            <label className="setting-label">
              Message Font Size <span className="setting-value">{fontSize}px</span>
            </label>
            <div className="range-row">
              <span className="range-label">A</span>
              <input
                type="range" min="13" max="19" step="1"
                value={fontSize}
                onChange={e => { setFontSize(e.target.value); setDirty(true) }}
                className="range-input"
              />
              <span className="range-label large">A</span>
            </div>
          </div>

          {/* ── Theme ── */}
          <div className="setting-group">
            <label className="setting-label">Theme</label>
            <div className="theme-option-row">
              {themeOptions.map(t => (
                <button
                  key={t.key}
                  className={`theme-option-btn ${theme === t.key ? 'active' : ''}`}
                  onClick={() => onThemeChange(t.key)}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Danger zone ── */}
          <div className="setting-group danger-group">
            <label className="setting-label danger-label">Danger Zone</label>
            <button className="danger-btn" onClick={handleClear}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Clear All Conversations
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={handleClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave} disabled={!dirty}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}
