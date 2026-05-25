import { useState, useRef, useEffect } from 'react'
import { IcoMenu, IcoDownload, IcoDlPDF, IcoDlDoc, IcoDlHTML, IcoDlMD } from './Icons'

export default function ChatHeader({
  activeSession,
  projects,
  sidebarOpen,
  onToggleSidebar,
  messages,
  onDownloadPDF,
  onDownloadDoc,
  onDownloadHTML,
  onDownloadMD,
}) {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const downloadBtnRef = useRef(null)

  useEffect(() => {
    if (!downloadOpen) return
    function onOutside(e) {
      if (!downloadBtnRef.current?.contains(e.target)) setDownloadOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [downloadOpen])

  const proj = activeSession?.projectId
    ? projects.find(p => p.id === activeSession.projectId)
    : null

  function wrap(fn) {
    return () => { fn(); setDownloadOpen(false) }
  }

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        {!sidebarOpen && (
          <button className="icon-btn" onClick={onToggleSidebar} title="Open sidebar">
            <IcoMenu />
          </button>
        )}
        <span className="chat-header-title">{activeSession?.title ?? 'AI Chat'}</span>
        {proj && (
          <span className="header-project-badge">
            <span className="header-project-dot" style={{ background: proj.color }} />
            {proj.name}
          </span>
        )}
      </div>

      <div className="chat-header-right">
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
              <button className="dl-item" onClick={wrap(onDownloadPDF)}>
                <IcoDlPDF /><span><strong>PDF</strong> · print / save as PDF</span>
              </button>
              <button className="dl-item" onClick={wrap(onDownloadDoc)}>
                <IcoDlDoc /><span><strong>Word</strong> · .doc file</span>
              </button>
              <button className="dl-item" onClick={wrap(onDownloadHTML)}>
                <IcoDlHTML /><span><strong>HTML</strong> · styled web page</span>
              </button>
              <button className="dl-item" onClick={wrap(onDownloadMD)}>
                <IcoDlMD /><span><strong>Markdown</strong> · plain text</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
