export function useDownload({ activeSession, messages, showToast }) {
  function buildTranscriptHTML() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      || (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const bg      = isDark ? '#13141c' : '#ffffff'
    const textC   = isDark ? '#f1f0f5' : '#0d0b14'
    const textMut = isDark ? '#9ca3af' : '#5c5566'
    const bubbleU = isDark ? '#a78bfa' : '#8b5cf6'
    const bubbleA = isDark ? '#1e1f2a' : '#f3f2f8'
    const border  = isDark ? '#272836' : '#e8e6ec'

    const rows = messages.map(m => {
      const isUser = m.role === 'user'
      const label  = isUser ? 'You' : 'AI'
      const safe   = m.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `
      <div style="margin:18px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${isUser ? bubbleU : textMut};margin-bottom:6px;padding:0 4px;">${label}</div>
        <div style="padding:12px 16px;border-radius:14px;background:${isUser ? bubbleU : bubbleA};color:${isUser ? '#fff' : textC};font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word;${isUser ? '' : 'border:1px solid ' + border + ';'}">
          ${safe}
        </div>
      </div>`
    }).join('')

    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>${activeSession?.title ?? 'Chat'}</title>
<style>body{font-family:system-ui,'Segoe UI',sans-serif;background:${bg};color:${textC};max-width:760px;margin:0 auto;padding:40px 28px;}
h1{font-size:20px;font-weight:700;border-bottom:2px solid ${bubbleU};padding-bottom:12px;margin:0 0 28px;}
.meta{font-size:12px;color:${textMut};margin-bottom:32px;}@media print{body{padding:20px;}}</style>
</head><body>
<h1>${activeSession?.title ?? 'Chat'}</h1>
<p class="meta">Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ${messages.length} messages</p>
${rows}</body></html>`
  }

  function slugify(title) {
    return (title ?? 'chat').slice(0, 40).replace(/[^a-z0-9]/gi, '-')
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: filename }).click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadMD() {
    if (!messages.length) return
    const body = messages.map(m => `### ${m.role === 'user' ? 'You' : 'AI'}\n\n${m.content}`).join('\n\n---\n\n')
    triggerDownload(
      new Blob([`# ${activeSession?.title ?? 'Chat'}\n\n${body}`], { type: 'text/markdown' }),
      `${slugify(activeSession?.title)}.md`
    )
    showToast('Downloaded as Markdown')
  }

  function handleDownloadHTML() {
    if (!messages.length) return
    triggerDownload(
      new Blob([buildTranscriptHTML()], { type: 'text/html' }),
      `${slugify(activeSession?.title)}.html`
    )
    showToast('Downloaded as HTML')
  }

  function handleDownloadDoc() {
    if (!messages.length) return
    triggerDownload(
      new Blob([buildTranscriptHTML()], { type: 'application/msword' }),
      `${slugify(activeSession?.title)}.doc`
    )
    showToast('Downloaded as Word document')
  }

  function handleDownloadPDF() {
    if (!messages.length) return
    const win = window.open('', '_blank')
    if (!win) { showToast('Allow pop-ups to save as PDF', 'error'); return }
    win.document.write(buildTranscriptHTML())
    win.document.write(`<script>window.onload=function(){window.print();setTimeout(()=>window.close(),800)}<\/script>`)
    win.document.close()
    showToast('Print dialog opened — choose "Save as PDF"')
  }

  return { handleDownloadMD, handleDownloadHTML, handleDownloadDoc, handleDownloadPDF }
}
