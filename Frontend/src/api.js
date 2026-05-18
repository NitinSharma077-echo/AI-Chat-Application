// In production (Render), set VITE_API_URL to your backend URL, e.g.:
// https://chat-backend.onrender.com
// Leave unset for local dev (Vite proxy handles /api → localhost:8000)
const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')  // strip trailing slash
  : '/api'

function getToken() {
  return localStorage.getItem('chat-token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  let res = await fetch(`${BASE}${path}`, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('chat-refresh-token')
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: refreshToken }),
      })
      if (refreshRes.ok) {
        const { access_token } = await refreshRes.json()
        localStorage.setItem('chat-token', access_token)
        // Retry original request with new token
        res = await fetch(`${BASE}${path}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${access_token}` },
        })
      } else {
        // Refresh failed — force logout
        localStorage.removeItem('chat-token')
        localStorage.removeItem('chat-refresh-token')
        localStorage.removeItem('chat-user')
        window.location.reload()
        throw new Error('Session expired')
      }
    }
  }

  return res
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () => request('/auth/me'),

  // ── Sessions ──────────────────────────────────────────
  getSessions: () => request('/sessions'),

  createSession: (data) =>
    request('/sessions', { method: 'POST', body: JSON.stringify(data) }),

  renameSession: (id, title) =>
    request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),

  deleteSession: (id) =>
    request(`/sessions/${id}`, { method: 'DELETE' }),

  getMessages: (id) => request(`/sessions/${id}/messages`),

  // ── Projects ──────────────────────────────────────────
  getProjects: () => request('/projects'),

  createProject: (data) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),

  updateProject: (id, data) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProject: (id) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  // ── Chat ──────────────────────────────────────────────
  chat: (data) =>
    request('/chat', { method: 'POST', body: JSON.stringify(data) }),
}
