import { useEffect } from 'react'

export function MessageContent({ content }) {
  const segments = content.split(/(```[\s\S]*?```)/g)
  if (segments.length === 1) return <span className="msg-text">{content}</span>
  return (
    <div className="msg-content">
      {segments.map((seg, i) => {
        const m = seg.match(/^```([^\n]*)\n?([\s\S]*?)```$/)
        if (m) {
          const lang = m[1].trim()
          const code = m[2].replace(/\n$/, '')
          return (
            <div key={i} className="msg-code">
              <div className="msg-code-header">
                <span className="msg-code-lang">{lang || 'code'}</span>
              </div>
              <pre className="msg-code-pre"><code>{code}</code></pre>
            </div>
          )
        }
        return seg ? <span key={i} className="msg-text">{seg}</span> : null
      })}
    </div>
  )
}

export function BubbleCursor({ containerRef }) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let last = 0

    function onMove(e) {
      const now = Date.now()
      if (now - last < 80) return
      last = now
      const b    = document.createElement('div')
      b.className = 'cursor-bubble'
      const size = 9 + Math.random() * 24
      const hue  = 248 + Math.random() * 48
      const lit  = 54  + Math.random() * 22
      const alph = 0.13 + Math.random() * 0.28
      const dur  = (0.85 + Math.random() * 0.9).toFixed(2)
      b.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;background:hsla(${hue},65%,${lit}%,${alph});animation-duration:${dur}s`
      document.body.appendChild(b)
      b.addEventListener('animationend', () => b.remove(), { once: true })
    }

    el.addEventListener('mousemove', onMove)
    return () => {
      el.removeEventListener('mousemove', onMove)
      document.querySelectorAll('.cursor-bubble').forEach(b => b.remove())
    }
  }, [containerRef])

  return null
}
