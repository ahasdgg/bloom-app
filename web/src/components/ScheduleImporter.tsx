/**
 * ScheduleImporter.tsx
 * Bottom-sheet modal for importing schedule events from photos via Gemini Vision API.
 * Requirements: 1.x, 2.x, 3.x, 4.x, 5.x, 6.2–6.3
 */

import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import {
  analyzeScheduleImages,
  validateFile,
  mapCategory,
  isValidHexColor,
  convertToTimestamps,
  CATEGORY_EMOJI,
  ALLOWED_TYPES,
  MAX_FILES,
  type ImportResult,
  type SupportedCategory,
} from '../services/geminiService'
import './ScheduleImporter.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportPhase = 'upload' | 'loading' | 'preview' | 'error'

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
  teacher?: string
  dateLabel: string
  timeLabel: string
  checked: boolean
}

interface ScheduleImporterProps {
  onClose: () => void
  isRu: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeEvents(result: ImportResult, batchTs: number): ExtractedEvent[] {
  return result.events
    .filter(ev => ev.title && ev.title.trim() !== '')
    .map((ev, index) => {
      const category = mapCategory(ev.category)
      const emoji = CATEGORY_EMOJI[category]
      const { startTs, endTs } = convertToTimestamps(ev.date, ev.start_time, ev.end_time)
      const color = isValidHexColor(ev.color) ? ev.color : undefined
      const dateLabel = ev.date
      const timeLabel = `${ev.start_time}–${ev.end_time}`
      return {
        id: `import_${batchTs}_${index}`,
        title: ev.title.trim(),
        category,
        emoji,
        startTs,
        endTs,
        note: [ev.notes, ev.teacher ? `👤 ${ev.teacher}` : ''].filter(Boolean).join(' · '),
        color,
        location: ev.location,
        teacher: ev.teacher,
        dateLabel,
        timeLabel,
        checked: true,
      }
    })
}

// ─── Component ────────────────────────────────────────────────────────────────

const ScheduleImporter: React.FC<ScheduleImporterProps> = ({ onClose, isRu }) => {
  const navigate = useNavigate()
  const addCustomEvent = useAppStore(s => s.addCustomEvent)

  const [phase, setPhase] = useState<ImportPhase>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [thumbUrls, setThumbUrls] = useState<string[]>([])
  const [inlineError, setInlineError] = useState<string>('')
  const [events, setEvents] = useState<ExtractedEvent[]>([])
  const [detectedPeriod, setDetectedPeriod] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [lastFiles, setLastFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File management ──────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    setInlineError('')

    const newFiles: File[] = []
    const newUrls: string[] = []
    let errorText = ''

    for (const file of arr) {
      if (files.length + newFiles.length >= MAX_FILES) {
        errorText = isRu
          ? `Максимум ${MAX_FILES} изображений за один сеанс`
          : `Maximum ${MAX_FILES} images per session`
        break
      }
      const validation = validateFile(file)
      if (!validation.valid) {
        errorText = validation.error ?? ''
        continue
      }
      newFiles.push(file)
      newUrls.push(URL.createObjectURL(file))
    }

    if (errorText) setInlineError(errorText)
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      setThumbUrls(prev => [...prev, ...newUrls])
    }
  }, [files.length, isRu])

  const removeFile = (index: number) => {
    URL.revokeObjectURL(thumbUrls[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setThumbUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  // ── Analysis ─────────────────────────────────────────────────────────────────

  const runAnalysis = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0) {
      setInlineError(isRu ? 'Добавьте хотя бы одно изображение' : 'Add at least one image')
      return
    }

    setLastFiles(filesToAnalyze)
    setPhase('loading')

    const lang = isRu ? 'ru' : 'en'
    const result = await analyzeScheduleImages(filesToAnalyze, lang)

    if (!result.ok) {
      setErrorMsg(result.error.message)
      setPhase('error')
      return
    }

    const data = result.data

    if (!data.events || data.events.length === 0) {
      setErrorMsg(
        isRu
          ? 'Не удалось распознать события на изображениях. Попробуйте загрузить более чёткое фото'
          : 'Could not recognize events in the images. Try uploading a clearer photo'
      )
      setPhase('error')
      return
    }

    const batchTs = Date.now()
    const normalized = normalizeEvents(data, batchTs)
    setEvents(normalized)
    setDetectedPeriod(data.detected_period ?? '')
    setPhase('preview')
  }

  const handleAnalyze = () => {
    if (files.length === 0) {
      setInlineError(isRu ? 'Добавьте хотя бы одно изображение' : 'Add at least one image')
      return
    }
    runAnalysis(files)
  }

  const handleRetry = () => {
    setPhase('upload')
    setErrorMsg('')
  }

  // ── Import ────────────────────────────────────────────────────────────────────

  const handleImport = () => {
    const checked = events.filter(e => e.checked)
    if (checked.length === 0) return

    for (const ev of checked) {
      try {
        addCustomEvent({
          id: ev.id,
          title: ev.title,
          category: ev.category,
          emoji: ev.emoji,
          startTs: ev.startTs,
          endTs: ev.endTs,
          note: ev.note || undefined,
          color: ev.color,
        })
      } catch {
        // Requirements 4.5: continue importing remaining events on error
        console.warn(`Failed to add event: ${ev.title}`)
      }
    }

    onClose()
    navigate('/path')
  }

  const toggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e))
  }

  const checkedCount = events.filter(e => e.checked).length

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="si-overlay" onClick={onClose}>
      <div className="si-sheet" onClick={e => e.stopPropagation()}>
        <div className="si-handle" />

        <div className="si-header">
          <h3 className="si-title">
            {phase === 'preview'
              ? (isRu ? 'Предпросмотр событий' : 'Preview Events')
              : (isRu ? 'Импорт из фото' : 'Import from Photo')}
          </h3>
          <button className="si-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="si-body">

          {/* ── Upload phase ── */}
          {phase === 'upload' && (
            <>
              <div
                className={`si-drop-zone${isDragOver ? ' drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label={isRu ? 'Выбрать изображения' : 'Select images'}
              >
                <div className="si-drop-icon">📷</div>
                <p className="si-drop-text">
                  {isRu ? 'Нажмите или перетащите фото расписания' : 'Click or drag schedule photos here'}
                </p>
                <p className="si-drop-hint">
                  {isRu
                    ? `JPEG, PNG, WEBP · до 10 МБ · до ${MAX_FILES} файлов`
                    : `JPEG, PNG, WEBP · up to 10 MB · up to ${MAX_FILES} files`}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
                aria-hidden="true"
              />

              {inlineError && (
                <div className="si-error-inline" role="alert">{inlineError}</div>
              )}

              {thumbUrls.length > 0 && (
                <div className="si-thumbs" role="list" aria-label={isRu ? 'Выбранные изображения' : 'Selected images'}>
                  {thumbUrls.map((url, i) => (
                    <div key={url} className="si-thumb" role="listitem">
                      <img src={url} alt={`${isRu ? 'Изображение' : 'Image'} ${i + 1}`} />
                      <button
                        className="si-thumb-del"
                        onClick={e => { e.stopPropagation(); removeFile(i) }}
                        aria-label={isRu ? `Удалить изображение ${i + 1}` : `Remove image ${i + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="si-actions">
                <button className="si-btn-cancel" onClick={onClose}>
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  className="si-btn-primary"
                  onClick={handleAnalyze}
                  disabled={files.length === 0}
                >
                  {isRu ? '🔍 Анализировать' : '🔍 Analyze'}
                </button>
              </div>
            </>
          )}

          {/* ── Loading phase ── */}
          {phase === 'loading' && (
            <div className="si-loading" role="status" aria-live="polite">
              <div className="si-spinner" aria-hidden="true" />
              <p className="si-loading-text">
                {isRu ? 'Анализирую расписание...' : 'Analyzing schedule...'}
              </p>
            </div>
          )}

          {/* ── Preview phase ── */}
          {phase === 'preview' && (
            <>
              <div className="si-info-bar">
                <strong>{events.length}</strong>{' '}
                {isRu ? 'событий распознано' : 'events recognized'}
                {detectedPeriod ? ` · ${detectedPeriod}` : ''}
              </div>

              <div className="si-events-list" role="list">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className={`si-event-item${ev.checked ? '' : ' unchecked'}`}
                    onClick={() => toggleEvent(ev.id)}
                    role="listitem"
                    aria-checked={ev.checked}
                  >
                    <div
                      className={`si-event-checkbox${ev.checked ? ' checked' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="si-event-emoji" aria-hidden="true">{ev.emoji}</span>
                    <div className="si-event-info">
                      <div className="si-event-title">{ev.title}</div>
                      <div className="si-event-meta">
                        <span>{ev.dateLabel}</span>
                        <span>{ev.timeLabel}</span>
                        <span className="si-event-cat">{ev.category}</span>
                        {ev.location && (
                          <span className="si-event-loc">📍 {ev.location}</span>
                        )}
                      </div>
                      {ev.note && <div className="si-event-note">{ev.note}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {checkedCount === 0 && (
                <p className="si-select-hint" role="alert">
                  {isRu ? 'Выберите хотя бы одно событие' : 'Select at least one event'}
                </p>
              )}

              <div className="si-actions">
                <button className="si-btn-cancel" onClick={onClose}>
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  className="si-btn-primary"
                  onClick={handleImport}
                  disabled={checkedCount === 0}
                >
                  {isRu
                    ? `✅ Импортировать (${checkedCount})`
                    : `✅ Import (${checkedCount})`}
                </button>
              </div>
            </>
          )}

          {/* ── Error phase ── */}
          {phase === 'error' && (
            <>
              <div className="si-error-state" role="alert">
                <div className="si-error-icon">⚠️</div>
                <h4 className="si-error-title">
                  {isRu ? 'Не удалось проанализировать' : 'Analysis failed'}
                </h4>
                <p className="si-error-msg">{errorMsg}</p>
              </div>

              <div className="si-actions">
                <button className="si-btn-cancel" onClick={onClose}>
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                {/* Show retry only for retriable errors (not "no events found") */}
                {!errorMsg.includes('распознать') && !errorMsg.includes('recognize') && (
                  <button
                    className="si-btn-primary"
                    onClick={() => runAnalysis(lastFiles)}
                  >
                    {isRu ? '🔄 Попробовать снова' : '🔄 Try again'}
                  </button>
                )}
                {(errorMsg.includes('распознать') || errorMsg.includes('recognize')) && (
                  <button className="si-btn-primary" onClick={handleRetry}>
                    {isRu ? '← Назад' : '← Back'}
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default ScheduleImporter
