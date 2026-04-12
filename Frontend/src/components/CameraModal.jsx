import { useRef, useEffect, useState } from 'react'

export default function CameraModal({ onCapture, onClose }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [captured, setCaptured] = useState(null) // base64 dataURL
  const [error, setError]       = useState(null)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      setError('Camera access denied or unavailable.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function capture() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !ready) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setCaptured(canvas.toDataURL('image/jpeg', 0.85))
  }

  function retake() {
    setCaptured(null)
  }

  function usePhoto() {
    stopCamera()
    onCapture(captured)
    onClose()
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) { stopCamera(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal camera-modal">

        <div className="modal-header">
          <div className="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Capture Photo
          </div>
          <button className="modal-close" onClick={() => { stopCamera(); onClose() }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body camera-body">
          {error ? (
            <div className="camera-error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{error}</p>
              <span>Check your browser permissions and try again.</span>
            </div>
          ) : captured ? (
            <img src={captured} className="camera-snapshot" alt="Captured photo" />
          ) : (
            <div className="camera-viewport">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              {!ready && <div className="camera-loading">Starting camera…</div>}
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="modal-footer">
          {captured ? (
            <>
              <button className="modal-btn secondary" onClick={retake}>
                ↺ Retake
              </button>
              <button className="modal-btn primary" onClick={usePhoto}>
                ✓ Use Photo
              </button>
            </>
          ) : (
            <>
              <button className="modal-btn secondary" onClick={() => { stopCamera(); onClose() }}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={capture} disabled={!ready || !!error}>
                📷 Capture
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
