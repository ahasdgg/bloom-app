import React, { useMemo, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore, CompletedActivity, CustomEvent } from "../store"
import { useTranslation } from "../i18n/useTranslation"
import {
  generateSmartGaps, detectOverlaps, getCategoryXOffset,
} from "../timeline/engine"
import type { StaticEvent, TimelineEvent, BoldnessLevel } from "../timeline/types"
import "./PathScreen.css"

const PX_PER_MIN  = 2.6
const DAY_START_H = 6
const DAY_END_H   = 24
const TOTAL_MIN   = (DAY_END_H - DAY_START_H) * 60
const CANVAS_H    = TOTAL_MIN * PX_PER_MIN
const CARD_W      = 220

function minsFromDayStart(ts: number) {
  const d = new Date(ts)
  return (d.getHours() - DAY_START_H) * 60 + d.getMinutes()
}
function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function fmtHour(h: number) { return `${String(h).padStart(2,"0")}:00` }
function fmtTime(ts: number, locale: string) {
  return new Date(ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
}
function tsFromTimeStr(dateStr: string, timeStr: string): number {
  return new Date(`${dateStr}T${timeStr}`).getTime()
}

const CAT_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  work:       { bg: "#e8eaf6", border: "#5c6bc0", text: "#3949ab" },
  study:      { bg: "#e3f2fd", border: "#42a5f5", text: "#1565c0" },
  fitness:    { bg: "#fce4ec", border: "#ef5350", text: "#c62828" },
  hiking:     { bg: "#e8f5e9", border: "#66bb6a", text: "#2e7d32" },
  cycling:    { bg: "#fff3e0", border: "#ffa726", text: "#e65100" },
  yoga:       { bg: "#f3e5f5", border: "#ab47bc", text: "#6a1b9a" },
  arts:       { bg: "#fff8e1", border: "#ffca28", text: "#f57f17" },
  culture:    { bg: "#e0f2f1", border: "#26a69a", text: "#00695c" },
  food:       { bg: "#fbe9e7", border: "#ff7043", text: "#bf360c" },
  social:     { bg: "#e8eaf6", border: "#7986cb", text: "#283593" },
  relaxation: { bg: "#f1f8e9", border: "#9ccc65", text: "#33691e" },
  adventure:  { bg: "#fff3e0", border: "#ff8f00", text: "#e65100" },
  nature:     { bg: "#e8f5e9", border: "#43a047", text: "#1b5e20" },
  family:     { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
  custom:     { bg: "#e8eaf6", border: "#7c4dff", text: "#4527a0" },
  default:    { bg: "#f5f1e8", border: "#b8944e", text: "#5d4037" },
}
function catColor(cat: string) { return CAT_COLOR[cat] ?? CAT_COLOR.default }

const CAT_OPTIONS = [
  { value: "work",       label: " Работа",    emoji: "" },
  { value: "study",      label: " Учёба",     emoji: "" },
  { value: "fitness",    label: " Спорт",     emoji: "" },
  { value: "food",       label: " Еда",       emoji: "" },
  { value: "culture",    label: " Культура",  emoji: "" },
  { value: "social",     label: " Социальное",emoji: "" },
  { value: "relaxation", label: " Отдых",     emoji: "" },
  { value: "nature",     label: " Природа",   emoji: "" },
  { value: "family",     label: " Семья",    emoji: "" },
  { value: "custom",     label: " Другое",    emoji: "" },
]

interface EventFormState {
  title: string
  category: string
  date: string
  startTime: string
  endTime: string
  note: string
}

const EMPTY_FORM: EventFormState = {
  title: "",
  category: "custom",
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  note: "",
}

const PathScreen: React.FC = () => {
  const store    = useAppStore()
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const locale   = store.language === "ru" ? "ru-RU" : "en-US"

  const [now, setNow]           = useState(Date.now())
  const scrollRef               = useRef<HTMLDivElement>(null)

  // Editor state
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState<EventFormState>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!scrollRef.current) return
    const y = Math.max(0, minsFromDayStart(now) * PX_PER_MIN - 180)
    scrollRef.current.scrollTop = y
  }, [])

  const completed    = store.completedActivities
  const customEvents = store.customEvents ?? []
  const profile      = { ageGroup: store.userAgeGroup ?? "adult" }
  const todayKey     = new Date(now).toDateString()
  // Boldness/censorship removed: show everything
  const boldness: BoldnessLevel = 4

  const todayStatic = useMemo<StaticEvent[]>(() => {
    const fromCompleted = completed
      .filter(a => new Date(a.completedAt).toDateString() === todayKey)
      .map(a => ({
        kind: "static" as const,
        id: a.id,
        title: a.activity.name,
        category: a.activity.category,
        startTs: a.completedAt - a.activity.duration * 60_000,
        endTs:   a.completedAt,
      }))
    const fromCustom = customEvents
      .filter(e => new Date(e.startTs).toDateString() === todayKey)
      .map(e => ({
        kind: "static" as const,
        id: e.id,
        title: e.title,
        category: e.category,
        startTs: e.startTs,
        endTs:   e.endTs,
      }))
    return [...fromCompleted, ...fromCustom].sort((a, b) => a.startTs - b.startTs)
  }, [completed, customEvents, todayKey])

  const allTodayEvents = useMemo<TimelineEvent[]>(
    () => generateSmartGaps(todayStatic, boldness, profile),
    [todayStatic, boldness, profile.ageGroup]
  )

  const overlaps = useMemo(() => detectOverlaps(allTodayEvents), [allTodayEvents])

  const historyDays = useMemo(() => {
    const map: Record<string, { completed: CompletedActivity[]; custom: CustomEvent[] }> = {}
    completed.forEach(a => {
      const k = new Date(a.completedAt).toDateString()
      if (k === todayKey) return
      if (!map[k]) map[k] = { completed: [], custom: [] }
      map[k].completed.push(a)
    })
    customEvents.forEach(e => {
      const k = new Date(e.startTs).toDateString()
      if (k === todayKey) return
      if (!map[k]) map[k] = { completed: [], custom: [] }
      map[k].custom.push(e)
    })
    return Object.entries(map).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }, [completed, customEvents, todayKey])

  const nowY        = minsFromDayStart(now) * PX_PER_MIN
  const hours       = Array.from({ length: DAY_END_H - DAY_START_H + 1 }, (_, i) => DAY_START_H + i)

  //  Form helpers 
  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) })
    setShowForm(true)
  }

  const openEdit = (ev: CustomEvent) => {
    const d = new Date(ev.startTs)
    const dateStr = d.toISOString().slice(0, 10)
    const startTime = d.toTimeString().slice(0, 5)
    const endTime   = new Date(ev.endTs).toTimeString().slice(0, 5)
    setEditingId(ev.id)
    setForm({ title: ev.title, category: ev.category, date: dateStr, startTime, endTime, note: ev.note ?? "" })
    setShowForm(true)
  }

  const saveForm = () => {
    if (!form.title.trim()) return
    const startTs = tsFromTimeStr(form.date, form.startTime)
    const endTs   = tsFromTimeStr(form.date, form.endTime)
    if (endTs <= startTs) return
    const catOpt  = CAT_OPTIONS.find(c => c.value === form.category)
    const emoji   = catOpt?.emoji ?? ""
    if (editingId) {
      store.updateCustomEvent({ id: editingId, title: form.title.trim(), category: form.category, emoji, startTs, endTs, note: form.note })
    } else {
      store.addCustomEvent({ id: "custom_" + Date.now(), title: form.title.trim(), category: form.category, emoji, startTs, endTs, note: form.note })
    }
    setShowForm(false)
  }

  const confirmDelete = (id: string) => setDeleteConfirm(id)
  const doDelete = () => {
    if (deleteConfirm) { store.deleteCustomEvent(deleteConfirm); setDeleteConfirm(null) }
  }

  const isRu = store.language === "ru"

  if (completed.length === 0 && customEvents.length === 0) {
    return (
      <div className="path-screen">
        <div className="path-header">
          <h1 className="header-title">{t("pathTitle")}</h1>
          <button className="add-event-btn" onClick={openAdd}>+ {isRu ? "Добавить" : "Add"}</button>
        </div>
        <div className="empty-state">
          <div className="empty-sprout"></div>
          <h2 className="empty-title">{t("journeyBegins")}</h2>
          <p className="empty-description">{t("journeyDescription")}</p>
          <button className="start-btn" onClick={() => navigate("/seed")}>
            {t("getRecommendation")}
          </button>
        </div>
        {showForm && <EventForm form={form} setForm={setForm} onSave={saveForm} onClose={() => setShowForm(false)} editingId={editingId} isRu={isRu} />}
      </div>
    )
  }

  return (
    <div className="path-screen">
      <div className="path-header">
        <div>
          <h1 className="header-title">{t("pathTitle")}</h1>
          <p className="header-subtitle">{completed.length + customEvents.length} {t("pathSubtitle")}</p>
        </div>
        <button className="add-event-btn" onClick={openAdd}>
          + {isRu ? "Добавить" : "Add"}
        </button>
      </div>

      {allTodayEvents.length > 0 && (
        <div className="live-section">
          <div className="live-label">
            <span className="live-dot" />
            {isRu ? "Сегодня" : "Today"}
          </div>
          <div className="canvas-wrapper" ref={scrollRef}>
            <div className="canvas" style={{ height: CANVAS_H }}>
              {hours.map(h => (
                <div key={h} className="hour-line" style={{ top: (h - DAY_START_H) * 60 * PX_PER_MIN }}>
                  <span className="hour-label">{fmtHour(h)}</span>
                </div>
              ))}
              {nowY >= 0 && nowY <= CANVAS_H && (
                <div className="now-line" style={{ top: nowY }}>
                  <div className="now-dot" /><div className="now-track" />
                </div>
              )}
              {(() => {
                const statics = allTodayEvents.filter(e => e.kind === "static")
                return statics.map((ev, i) => {
                  if (i === 0) return null
                  const prev  = statics[i - 1]
                  const yPrev = minsFromDayStart(prev.endTs) * PX_PER_MIN
                  const yCurr = minsFromDayStart(ev.startTs) * PX_PER_MIN
                  const xPrev = 50 + getCategoryXOffset(prev.category, hashStr(prev.id))
                  const xCurr = 50 + getCategoryXOffset(ev.category, hashStr(ev.id))
                  return (
                    <svg key={`t${i}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                      <line x1={`${xPrev}%`} y1={yPrev} x2={`${xCurr}%`} y2={yCurr}
                        stroke="rgba(184,148,78,0.2)" strokeWidth="1.5" strokeDasharray="4 6" />
                    </svg>
                  )
                })
              })()}
              {allTodayEvents.map(ev => {
                const yTop     = minsFromDayStart(ev.startTs) * PX_PER_MIN
                const heightPx = Math.max((ev.endTs - ev.startTs) / 60_000 * PX_PER_MIN, 40)
                const seed     = hashStr(ev.id)
                const xOff     = getCategoryXOffset(ev.category, seed)
                const isNow    = ev.startTs <= now && now <= ev.endTs
                const isPast   = ev.endTs < now
                const isAI     = ev.kind === "ai"
                const isCustom = ev.id.startsWith("custom_")
                const isImport = ev.id.startsWith("import_")
                const hasOvlp  = (overlaps.get(ev.id)?.length ?? 0) > 0
                const colors   = catColor(ev.category)
                const shift    = hasOvlp ? (seed % 2 === 0 ? 30 : -30) : 0
                const customEv = isCustom ? customEvents.find(c => c.id === ev.id) : null
                return (
                  <div key={ev.id}
                    className={["flow-card", isNow ? "is-now" : "", isPast ? "is-past" : "", isAI ? "is-ai" : "", isCustom ? "is-custom" : ""].join(" ")}
                    style={{
                      top: yTop, left: `calc(${50 + xOff}% - ${CARD_W / 2}px + ${shift}px)`,
                      minHeight: heightPx, width: CARD_W,
                      background: isNow ? `linear-gradient(135deg, ${colors.bg}, #fff)` : colors.bg,
                      borderColor: colors.border, color: colors.text,
                      boxShadow: isNow ? `0 0 0 2px ${colors.border}, 0 8px 24px ${colors.border}44` : `0 2px 10px ${colors.border}33`,
                      opacity: isPast ? 0.65 : 1,
                      zIndex: isNow ? 20 : hasOvlp ? 10 : 3,
                    }}>
                    {isAI && <div className="ai-badge"> AI</div>}
                    {isCustom && (
                      <div className="custom-actions">
                        <button className="custom-edit-btn" onClick={() => customEv && openEdit(customEv)}></button>
                        <button className="custom-del-btn" onClick={() => confirmDelete(ev.id)}></button>
                      </div>
                    )}
                    {isNow && <div className="now-pulse-ring" />}

                    <div className="flow-card-inner">
                      {(isAI || isCustom) && <span className="flow-emoji">{(ev as any).emoji ?? ""}</span>}
                      <div className="flow-info">
                        <div className="flow-name">{ev.title}</div>
                        <div className="flow-meta">
                          <span>{fmtTime(ev.startTs, locale)}</span>
                          {isAI && <span className="cost-badge">{(ev as any).costType === "solo" ? " Solo" : " External"}</span>}
                          {isImport && <span className="import-badge">{isRu ? "Импорт" : "Import"}</span>}
                          {isCustom && !isImport && <span className="custom-badge">{isRu ? "Моё" : "Mine"}</span>}
                        </div>
                        {isCustom && customEv?.note && <div className="flow-desc">{customEv.note}</div>}
                        {isAI && (ev as any).description && <div className="flow-desc">{(ev as any).description}</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {historyDays.length > 0 && (
        <div className="history-section">
          {historyDays.map(([dayKey, { completed: dayCompleted, custom: dayCustom }]) => {
            const label = new Date(dayKey).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })
            const allItems = [
              ...dayCompleted.map(a => ({ id: a.id, title: a.activity.name, category: a.activity.category, ts: a.completedAt, rating: a.rating, pts: a.pointsEarned, isCustom: false, note: "" })),
              ...dayCustom.map(e => ({ id: e.id, title: e.title, category: e.category, ts: e.startTs, rating: 0, pts: 0, isCustom: true, note: e.note ?? "" })),
            ].sort((a, b) => a.ts - b.ts)
            return (
              <div key={dayKey} className="history-day">
                <div className="day-label">{label}</div>
                <div className="day-items">
                  {allItems.map(item => {
                    const colors = catColor(item.category)
                    const time  = fmtTime(item.ts, locale)
                    const customEv = item.isCustom ? customEvents.find(c => c.id === item.id) : null
                    const isImportItem = item.id.startsWith("import_")
                    return (
                      <div key={item.id} className={`history-card ${item.isCustom ? "history-card--custom" : ""}`}
                        style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
                          <div className="flow-info">
                            <div className="flow-name">{item.title}</div>
                            <div className="flow-meta">
                              <span className="flow-time">{time}</span>
                              {!item.isCustom && <><span>{"".repeat(item.rating)}</span><span className="flow-pts">+{item.pts}pts</span></>}
                              {isImportItem && <span className="import-badge">{isRu ? "Импорт" : "Import"}</span>}
                              {item.isCustom && !isImportItem && <span className="custom-badge">{isRu ? "Моё" : "Mine"}</span>}
                            </div>
                            {item.note && <div className="flow-desc">{item.note}</div>}
                          </div>
                        {item.isCustom && (
                          <div className="history-card-actions">
                            <button onClick={() => customEv && openEdit(customEv)}></button>
                            <button onClick={() => confirmDelete(item.id)}></button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <EventForm form={form} setForm={setForm} onSave={saveForm} onClose={() => setShowForm(false)} editingId={editingId} isRu={isRu} />
      )}

      {deleteConfirm && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-dialog" onClick={e => e.stopPropagation()}>
            <p>{isRu ? "Удалить это событие?" : "Delete this event?"}</p>
            <div className="delete-btns">
              <button className="delete-btn-cancel" onClick={() => setDeleteConfirm(null)}>{isRu ? "Отмена" : "Cancel"}</button>
              <button className="delete-btn-confirm" onClick={doDelete}>{isRu ? "Удалить" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface EventFormProps {
  form: EventFormState
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>
  onSave: () => void
  onClose: () => void
  editingId: string | null
  isRu: boolean
}

const EventForm: React.FC<EventFormProps> = ({ form, setForm, onSave, onClose, editingId, isRu }) => {
  const set = (k: keyof EventFormState, v: string) => setForm(f => ({ ...f, [k]: v }))
  const isValid = form.title.trim().length > 0 && form.endTime > form.startTime
  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="event-form" onClick={e => e.stopPropagation()}>
        <div className="form-header">
          <h3 className="form-title">{editingId ? (isRu ? "Редактировать" : "Edit Event") : (isRu ? "Новое событие" : "New Event")}</h3>
          <button className="form-close" onClick={onClose}></button>
        </div>

        <div className="form-field">
          <label>{isRu ? "Название" : "Title"}</label>
          <input className="form-input" placeholder={isRu ? "Что вы делаете?" : "What are you doing?"} value={form.title} onChange={e => set("title", e.target.value)} autoFocus />
        </div>

        <div className="form-field">
          <label>{isRu ? "Категория" : "Category"}</label>
          <div className="cat-grid">
            {CAT_OPTIONS.map(c => (
              <button key={c.value} className={`cat-btn ${form.category === c.value ? "active" : ""}`} onClick={() => set("category", c.value)}>
                <span>{c.emoji}</span>
                <span>{c.label.split(" ").slice(1).join(" ")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>{isRu ? "Дата" : "Date"}</label>
          <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>{isRu ? "Начало" : "Start"}</label>
            <input className="form-input" type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
          </div>
          <div className="form-field">
            <label>{isRu ? "Конец" : "End"}</label>
            <input className="form-input" type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} />
          </div>
        </div>

        <div className="form-field">
          <label>{isRu ? "Заметка (опционально)" : "Note (optional)"}</label>
          <textarea className="form-textarea" placeholder={isRu ? "Добавьте заметку..." : "Add a note..."} value={form.note} onChange={e => set("note", e.target.value)} rows={2} />
        </div>

        <div className="form-actions">
          <button className="form-btn-cancel" onClick={onClose}>{isRu ? "Отмена" : "Cancel"}</button>
          <button className="form-btn-save" onClick={onSave} disabled={!isValid}>
            {editingId ? (isRu ? "Сохранить" : "Save") : (isRu ? "Добавить" : "Add")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PathScreen
