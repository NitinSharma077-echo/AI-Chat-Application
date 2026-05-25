import { useRef } from 'react'
import { IcoPaperclip, IcoSend, IcoSpinner, IcoFile, IcoX } from './Icons'

const ACCEPTED_FILETYPES = '.txt,.md,.py,.js,.ts,.jsx,.tsx,.json,.csv,.html,.css,.xml,.yaml,.yml,.sh,.toml,.env'

export default function ChatInput({
  activeId,
  input,
  setInput,
  attached,
  setAttached,
  loading,
  messagesLoading,
  canSend,
  onSend,
  textareaRef,
  onFileSelect,
}) {
  const fileInputRef = useRef(null)

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  if (!activeId) return null

  return (
    <footer className="chat-footer">
      {attached && (
        <div className="chips-row">
          <div className="file-chip">
            <IcoFile />
            <span className="chip-name">{attached.name}</span>
            <button className="chip-remove" onClick={() => setAttached(null)}>
              <IcoX size={11} />
            </button>
          </div>
        </div>
      )}

      <div className="input-bar">
        <button
          className="tool-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <IcoPaperclip />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          placeholder="Message AI…"
          disabled={loading || messagesLoading}
          rows={1}
          autoFocus
        />

        <button
          className={`send-btn ${loading ? 'loading' : ''}`}
          onClick={onSend}
          disabled={!canSend}
          title="Send (Enter)"
        >
          {loading ? <IcoSpinner /> : <IcoSend />}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILETYPES}
        onChange={onFileSelect}
        style={{ display: 'none' }}
      />

      <p className="input-hint">Enter to send · Shift+Enter for new line</p>
    </footer>
  )
}
