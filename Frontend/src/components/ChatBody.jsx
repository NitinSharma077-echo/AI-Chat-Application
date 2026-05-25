import { IcoBot, IcoSparkle } from './Icons'
import { MessageContent, BubbleCursor } from './MessageContent'

const STARTER_CHIPS = [
  { label: 'Explain a concept', fill: 'Explain how '          },
  { label: 'Write some code',   fill: 'Write a '              },
  { label: 'Summarize a topic', fill: 'Summarize '            },
  { label: 'Help me debug',     fill: 'Help me debug this:\n\n' },
]

export default function ChatBody({
  messages,
  loading,
  messagesLoading,
  isEmpty,
  activeId,
  user,
  chatBodyRef,
  bottomRef,
  onChipClick,
}) {
  return (
    <main className="chat-body" ref={chatBodyRef}>
      {/* Bubble cursor when no session is open */}
      {isEmpty && !activeId && <BubbleCursor containerRef={chatBodyRef} />}

      {/* No session selected */}
      {!activeId && isEmpty && (
        <div className="chat-empty">
          <div className="empty-orb"><IcoSparkle /></div>
          <p className="empty-heading">Welcome back, {user.username}!</p>
          <p className="empty-sub">Click <strong>New Chat</strong> to start a conversation.</p>
        </div>
      )}

      {/* Session open but no messages yet */}
      {activeId && isEmpty && !messagesLoading && (
        <div className="chat-empty">
          <div className="empty-orb"><IcoSparkle /></div>
          <p className="empty-heading">How can I help you today?</p>
          <p className="empty-sub">Ask anything, attach a file, or start a project.</p>
          <div className="empty-chips">
            {STARTER_CHIPS.map(({ label, fill }) => (
              <button
                key={label}
                className="empty-chip"
                onClick={() => onChipClick(fill)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {messagesLoading && (
        <div className="messages-loading">
          <div className="msg-load-spinner" />
          <p>Loading messages…</p>
        </div>
      )}

      {/* Message list */}
      {messages.map((msg, i) => (
        <div key={i} className={`msg-row ${msg.role}`}>
          {msg.role === 'assistant' && <div className="msg-avatar"><IcoBot /></div>}
          <div className={`msg-bubble ${msg.role}`}>
            {msg.content && <MessageContent content={msg.content} />}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {loading && (
        <div className="msg-row assistant">
          <div className="msg-avatar"><IcoBot /></div>
          <div className="msg-bubble assistant typing">
            <span /><span /><span />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </main>
  )
}
