import { useState } from 'react'
import { api } from '../api'
import logo from '../assets/logo.svg'

export default function AuthPage({ onAuth }) {
  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  function switchMode(m) {
    setMode(m); setError('')
    setUsername(''); setEmail(''); setPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const payload = mode === 'login'
        ? { email, password }
        : { username, email, password }

      const fn  = mode === 'login' ? api.login : api.register
      const res = await fn(payload)
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Something went wrong')
        return
      }

      localStorage.setItem('chat-token',         data.access_token)
      localStorage.setItem('chat-refresh-token', data.refresh_token)
      localStorage.setItem('chat-user',          JSON.stringify(data.user))
      onAuth(data.user)
    } catch (err) {
      setError('Cannot reach server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <img src={logo} alt="AI Chat" className="auth-brand-logo" />
          </div>
          <h1 className="auth-brand-name">AI Chat</h1>
          <p className="auth-brand-sub">Your private local AI assistant</p>
        </div>

        {/* Tab toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Your name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus={mode === 'register'}
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-pw-wrap">
              <input
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
              >
                {showPw ? <IcoEyeOff /> : <IcoEye />}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className={`auth-submit ${loading ? 'loading' : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading
              ? <IcoSpinner />
              : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login'
            ? <>No account? <button className="auth-switch-btn" onClick={() => switchMode('register')}>Create one →</button></>
            : <>Already have an account? <button className="auth-switch-btn" onClick={() => switchMode('login')}>Sign in →</button></>
          }
        </p>
      </div>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */
function IcoSparkle() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>
}
function IcoEye() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function IcoEyeOff() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}
function IcoSpinner() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="spin-icon"><path d="M12 2a10 10 0 0 1 0 20" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
}
