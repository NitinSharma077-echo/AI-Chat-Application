export default function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal help-modal">

        <div className="modal-header">
          <div className="modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Help & Guide
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body help-body">

          <section className="help-section">
            <h3>Getting Started</h3>
            <p>Make sure <strong>Ollama</strong> is running and a model is pulled before using the app.</p>
            <div className="help-code">
              <code>ollama serve</code>
              <code>ollama pull llama3</code>
            </div>
            <p>Then start the backend and frontend — see the README for full setup steps.</p>
          </section>

          <section className="help-section">
            <h3>Chat Bar Features</h3>
            <div className="help-features">
              <div className="help-feature">
                <span className="feature-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </span>
                <div>
                  <strong>Upload File</strong>
                  <p>Attach a text file (.txt, .py, .js, .json, etc.) and its content is included in your message for the AI to analyse.</p>
                </div>
              </div>
              <div className="help-feature">
                <span className="feature-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </span>
                <div>
                  <strong>Camera Capture</strong>
                  <p>Take a photo from your webcam and send it with your message. Requires a vision model like <code>llava</code> — change it in Settings.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>Header Actions</h3>
            <div className="help-features">
              <div className="help-feature">
                <span className="feature-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </span>
                <div>
                  <strong>Download</strong>
                  <p>Saves the current conversation as a <code>.md</code> Markdown file.</p>
                </div>
              </div>
              <div className="help-feature">
                <span className="feature-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                </span>
                <div>
                  <strong>Capture</strong>
                  <p>Saves the conversation as a styled <code>.html</code> snapshot. Open in a browser and print to PDF for a screenshot.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>Keyboard Shortcuts</h3>
            <table className="shortcuts-table">
              <tbody>
                <tr><td><kbd>Enter</kbd></td><td>Send message</td></tr>
                <tr><td><kbd>Shift</kbd> + <kbd>Enter</kbd></td><td>New line in message</td></tr>
              </tbody>
            </table>
          </section>

          <section className="help-section">
            <h3>Using Vision Models</h3>
            <p>To analyse photos captured by the camera, switch to a multimodal model:</p>
            <div className="help-code">
              <code>ollama pull llava</code>
            </div>
            <p>Then go to <strong>Settings → AI Model</strong> and enter <code>llava</code>.</p>
          </section>

          <section className="help-section">
            <h3>Backend Health</h3>
            <p>Check if everything is running at:</p>
            <div className="help-code">
              <code>http://localhost:8000/health</code>
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}
