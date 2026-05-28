/**
 * ChatScreen.tsx
 * AI chat for importing schedule events via text or photo.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import {
  analyzeScheduleImages,
  mapCategory,
  isValidHexColor,
  convertToTimestamps,
  CATEGORY_EMOJI,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  type ImportResult,
  type SupportedCategory,
} from '../services/geminiService'
import './ChatScreen.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  images?: string[]       // object URLs for preview
  events?: ExtractedEvent[]
  loading?: boolean
}

interface ExtractedEvent {
  id: string
  title: string
  category: SupportedCategory
  emoji: string
  startTs: number
  endTs: number
  note: string
  color?: string
  location?: string
  dateLabel: string
  timeLabel: string
  checked: boolean
}

// ─── Gemini text analysis ─────────────────────────────────────────────────────

const API_KEY = (import.meta as any)?.env?.VITE_GEMINI_API_KEY as string | undefined

const TEXT_PROMPT = `Ты — ассистент Bloom App. Пользователь описывает своё расписание текстом. 
Извлеки все события и верни ТОЛЬКО чистый JSON без дополнительного текста:
{"action":"import","events":[{"date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","title":"string","location":"string","notes":"string","color":"#RRGGBB","category":"string"}],"source_images":0,"detected_period":"string","status":"ready_for_import"}
Если дата не указана явно — используй сегодняшнюю дату (${new Date().toISOString().slice(0, 10)}).
Если время окончания не указано — добавь 1 час к началу.
Категории: study, work, fitness, food, culture, social, relaxation, nature, family, custom.
Цвета подбирай сам по смыслу события.`

async function analyzeText(text: string): Promise<ImportResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured (VITE_GEMINI_API_KEY)')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`
  const body = {
    contents: [{
      parts: [
        { text: TEXT_PROMPT },
        { text: `Расписание пользователя:\n${text}` },
      ]
    }]
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const raw = await res.json()
  const jsonStr: string = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as ImportResult
}

// ─── Normalize events ─────────────────────────────────────────────────────────

function normalizeEvents(result: ImportResult, batchTs: number): ExtractedEvent[] {
  return result.events
    .filter(ev => ev.title?.trim())
    .map((ev, i) => {
      const category = mapCategory(ev.category)
      const { startTs, endTs } = convertToTimestamps(ev.date, ev.start_time, ev.end_time)
      return {
        id: `import_${batchTs}_${i}`,
        title: ev.title.trim(),
        category,
        emoji: CATEGORY_EMOJI[category],
        startTs,
        endTs,
        note: ev.notes ?? '',
        color: isValidHexColor(ev.color) ? ev.color : undefined,
        location: ev.location,
        dateLabel: ev.date,
        timeLabel: `${ev.start_time}–${ev.end_time}`,
        checked: true,
      }
    })
}

// ─── Component ────────────────────────────────────────────────────────────────

const ChatScreen: React.FC = () => {
  const store = useAppStore()
  const navigate = useNavigate()
  const isRu = store.language === 'ru'

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: isRu
        ? '👋 Привет! Напиши своё расписание текстом или прикрепи фото — я перенесу всё в таймлайн.'
        : '👋 Hi! Write your schedule as text or attach a photo — I\'ll add everything to your timeline.',
    }
  ])
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [attachedUrls, setAttachedUrls] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── File attach ──────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(f => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE)
    setAttachedFiles(prev => [...prev, ...valid].slice(0, 5))
    setAttachedUrls(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))].slice(0, 5))
    e.target.value = ''
  }

  // ── Paste from clipboard (Ctrl+V) ────────────────────────────────────────────

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return

    e.preventDefault()
    const newFiles: File[] = []
    const newUrls: string[] = []

    imageItems.forEach(item => {
      const file = item.getAsFile()
      if (!file) return
      // Accept any image from clipboard (screenshots are image/png)
      newFiles.push(file)
      newUrls.push(URL.createObjectURL(file))
    })

    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5))
      setAttachedUrls(prev => [...prev, ...newUrls].slice(0, 5))
    }
  }

  const removeAttachment = (i: number) => {
    URL.revokeObjectURL(attachedUrls[i])
    setAttachedFiles(prev => prev.filter((_, j) => j !== i))
    setAttachedUrls(prev => prev.filter((_, j) => j !== i))
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  const send = async () => {
    const text = input.trim()
    if (!text && attachedFiles.length === 0) return
    if (sending) return

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      images: [...attachedUrls],
    }
    const loadingMsg: Message = {
      id: `a_${Date.now()}`,
      role: 'assistant',
      text: '',
      loading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    const filesToSend = [...attachedFiles]
    const urlsSnapshot = [...attachedUrls]
    setAttachedFiles([])
    setAttachedUrls([])
    setSending(true)

    try {
      let result: ImportResult

      if (filesToSend.length > 0) {
        const res = await analyzeScheduleImages(filesToSend, isRu ? 'ru' : 'en')
        if (!res.ok) throw new Error(res.error.message)
        result = res.data
      } else {
        result = await analyzeText(text)
      }

      const batchTs = Date.now()
      const events = normalizeEvents(result, batchTs)

      const replyText = events.length === 0
        ? (isRu ? 'Не удалось распознать события. Попробуй описать подробнее.' : 'Could not find any events. Try describing in more detail.')
        : (isRu
            ? `Нашёл ${events.length} событий${result.detected_period ? ` (${result.detected_period})` : ''}. Добавить в таймлайн?`
            : `Found ${events.length} event(s)${result.detected_period ? ` (${result.detected_period})` : ''}. Add to timeline?`)

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, loading: false, text: replyText, events: events.length > 0 ? events : undefined } : m
      ))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, loading: false, text: isRu ? `Ошибка: ${msg}` : `Error: ${msg}` } : m
      ))
    } finally {
      setSending(false)
      // revoke user-side URLs after send
      urlsSnapshot.forEach(u => URL.revokeObjectURL(u))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // ── Import events ─────────────────────────────────────────────────────────────

  const importEvents = (events: ExtractedEvent[], msgId: string) => {
    const checked = events.filter(e => e.checked)
    checked.forEach(ev => {
      try {
        store.addCustomEvent({
          id: ev.id,
          title: ev.title,
          category: ev.category,
          emoji: ev.emoji,
          startTs: ev.startTs,
          endTs: ev.endTs,
          note: ev.note || undefined,
          color: ev.color,
        })
      } catch { /* continue */ }
    })
    const confirmText = isRu
      ? `✅ Добавлено ${checked.length} событий в таймлайн!`
      : `✅ Added ${checked.length} event(s) to timeline!`
    setMessages(prev => [
      ...prev.map(m => m.id === msgId ? { ...m, events: undefined } : m),
      { id: `confirm_${Date.now()}`, role: 'assistant' as const, text: confirmText }
    ])
    setTimeout(() => navigate('/path'), 800)
  }

  const toggleEvent = (msgId: string, evId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.events
        ? { ...m, events: m.events.map(e => e.id === evId ? { ...e, checked: !e.checked } : e) }
        : m
    ))
  }

  // ── Textarea auto-resize ──────────────────────────────────────────────────────

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="chat-screen">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">🤖</div>
          <div>
            <div className="chat-header-name">{isRu ? 'AI Ассистент' : 'AI Assistant'}</div>
            <div className="chat-header-sub">{isRu ? 'Импорт расписания' : 'Schedule import'}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.role}`}>
            {msg.role === 'assistant' && <div className="chat-avatar-sm">🤖</div>}
            <div className={`chat-bubble ${msg.role}`}>
              {/* User images */}
              {msg.images && msg.images.length > 0 && (
                <div className="chat-bubble-images">
                  {msg.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="chat-bubble-img" />
                  ))}
                </div>
              )}

              {/* Text */}
              {msg.loading ? (
                <div className="chat-typing">
                  <span /><span /><span />
                </div>
              ) : (
                <p className="chat-bubble-text">{msg.text}</p>
              )}

              {/* Event list */}
              {msg.events && msg.events.length > 0 && (
                <div className="chat-events">
                  {msg.events.map(ev => (
                    <div
                      key={ev.id}
                      className={`chat-event-item ${ev.checked ? 'checked' : ''}`}
                      onClick={() => toggleEvent(msg.id, ev.id)}
                    >
                      <div className={`chat-event-check ${ev.checked ? 'on' : ''}`}>
                        {ev.checked && '✓'}
                      </div>
                      <span className="chat-event-emoji">{ev.emoji}</span>
                      <div className="chat-event-info">
                        <div className="chat-event-title">{ev.title}</div>
                        <div className="chat-event-meta">
                          {ev.dateLabel} · {ev.timeLabel}
                          {ev.location && <> · 📍{ev.location}</>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    className="chat-import-btn"
                    disabled={!msg.events.some(e => e.checked)}
                    onClick={() => importEvents(msg.events!, msg.id)}
                  >
                    {isRu
                      ? `Добавить в таймлайн (${msg.events.filter(e => e.checked).length})`
                      : `Add to timeline (${msg.events.filter(e => e.checked).length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        {/* Attached image previews */}
        {attachedUrls.length > 0 && (
          <div className="chat-attachments">
            {attachedUrls.map((url, i) => (
              <div key={url} className="chat-attachment">
                <img src={url} alt="" />
                <button onClick={() => removeAttachment(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <button
            className="chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label={isRu ? 'Прикрепить фото' : 'Attach photo'}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={isRu
              ? 'Напиши расписание или прикрепи фото...'
              : 'Write your schedule or attach a photo...'}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
          />
          <button
            className={`chat-send-btn ${(input.trim() || attachedFiles.length > 0) && !sending ? 'active' : ''}`}
            onClick={send}
            disabled={sending || (!input.trim() && attachedFiles.length === 0)}
            aria-label={isRu ? 'Отправить' : 'Send'}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatScreen
