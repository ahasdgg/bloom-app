/**
 * geminiService.ts
 * Gemini Vision API client for Schedule Image Import feature.
 * Requirements: 2.1–2.7, 7.1–7.5
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedCategory =
  | 'study' | 'work' | 'fitness' | 'food'
  | 'culture' | 'social' | 'relaxation'
  | 'nature' | 'family' | 'custom'

export const SUPPORTED_CATEGORIES: SupportedCategory[] = [
  'study', 'work', 'fitness', 'food',
  'culture', 'social', 'relaxation',
  'nature', 'family', 'custom',
]

export interface GeminiRawEvent {
  date: string        // "YYYY-MM-DD"
  start_time: string  // "HH:MM"
  end_time: string    // "HH:MM"
  title: string
  location?: string
  teacher?: string
  notes?: string
  color?: string
  category?: string
}

export interface ImportResult {
  action: string
  events: GeminiRawEvent[]
  source_images: number
  detected_period: string
  status: 'ready_for_import' | 'error' | 'no_events'
}

export interface GeminiError {
  code: number
  message: string
}

export type GeminiResponse =
  | { ok: true; data: ImportResult }
  | { ok: false; error: GeminiError }

// ─── Constants ────────────────────────────────────────────────────────────────

const API_KEY = 'AIzaSyCpylP_3TS0kWAQSdHVWcxwxotoifsgfx0'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`
const TIMEOUT_MS = 60_000

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 МБ
export const MAX_FILES = 10
export const MIN_FILES = 1

const SYSTEM_PROMPT = `Ты — интеллектуальный ассистент Bloom App. Проанализируй изображения расписаний и верни ТОЛЬКО чистый JSON без дополнительного текста в формате: {"action":"import","events":[{"date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","title":"string","location":"string","teacher":"string","notes":"string","color":"#RRGGBB","category":"string"}],"source_images":N,"detected_period":"string","status":"ready_for_import"}. Поле status может быть "ready_for_import", "error" или "no_events". Категории: study, work, fitness, food, culture, social, relaxation, nature, family, custom.`

const CATEGORY_MAP: Record<string, SupportedCategory> = {
  study:      'study',
  work:       'work',
  fitness:    'fitness',
  food:       'food',
  culture:    'culture',
  social:     'social',
  relaxation: 'relaxation',
  nature:     'nature',
  family:     'family',
  personal:   'custom',
  other:      'custom',
}

export const CATEGORY_EMOJI: Record<SupportedCategory, string> = {
  study:      '📚',
  work:       '💼',
  fitness:    '💪',
  food:       '🍽️',
  culture:    '🏛️',
  social:     '👥',
  relaxation: '🧖',
  nature:     '🌿',
  family:     '👨‍👩‍👧',
  custom:     '📅',
}

const ERROR_MESSAGES = {
  timeout: {
    en: 'AI response timeout exceeded',
    ru: 'Превышено время ожидания ответа от AI',
  },
  invalidJson: {
    en: 'Invalid AI response',
    ru: 'Некорректный ответ от AI',
  },
  http: {
    en: (code: number) => `API error: ${code}`,
    ru: (code: number) => `Ошибка API: ${code}`,
  },
}

// ─── Utility functions (exported for testing) ─────────────────────────────────

/**
 * Validates a file's MIME type and size.
 * Property 1: file is accepted iff type ∈ ALLOWED_TYPES AND size ≤ MAX_FILE_SIZE
 */
export function validateFile(file: Pick<File, 'type' | 'size'>): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Неподдерживаемый формат. Используйте JPEG, PNG или WEBP' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Файл слишком большой. Максимальный размер — 10 МБ' }
  }
  return { valid: true }
}

/**
 * Maps a raw category string from Gemini to SupportedCategory.
 * Property 5: result is always a SupportedCategory; known values map to themselves.
 */
export function mapCategory(raw: string | undefined): SupportedCategory {
  if (!raw) return 'custom'
  return CATEGORY_MAP[raw.toLowerCase()] ?? 'custom'
}

/**
 * Validates a HEX color string.
 * Property 10: returns true iff color matches #RGB or #RRGGBB
 */
export function isValidHexColor(value: string | undefined): boolean {
  if (value === undefined || value === null) return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

/**
 * Validates a single extracted event from Gemini.
 * Requirements 7.2: date YYYY-MM-DD, times HH:MM, title non-empty.
 */
export function validateExtractedEvent(event: GeminiRawEvent): boolean {
  if (!event.title || event.title.trim() === '') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return false
  if (!/^\d{2}:\d{2}$/.test(event.start_time)) return false
  if (!/^\d{2}:\d{2}$/.test(event.end_time)) return false
  return true
}

/**
 * Converts date + start/end time strings to Unix timestamps (ms).
 * Property 6: if end_time <= start_time, endTs = startTs + 3_600_000
 * Requirements 2.4, 7.3
 */
export function convertToTimestamps(
  date: string,
  startTime: string,
  endTime: string,
): { startTs: number; endTs: number } {
  const startTs = new Date(`${date}T${startTime}:00`).getTime()
  let endTs = new Date(`${date}T${endTime}:00`).getTime()
  if (endTs <= startTs) {
    endTs = startTs + 3_600_000
  }
  return { startTs, endTs }
}

/**
 * Serializes an ImportResult back to a JSON string (pretty-printer).
 * Requirements 7.4
 */
export function prettyPrintImportResult(result: ImportResult): string {
  return JSON.stringify(result)
}

/**
 * Parses a JSON string into an ImportResult.
 * Throws on invalid JSON.
 * Requirements 7.1
 */
export function parseImportResult(jsonString: string): ImportResult {
  // Strip markdown code fences if Gemini wraps the response
  const cleaned = jsonString
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const parsed = JSON.parse(cleaned) as ImportResult
  return parsed
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result is "data:<mime>;base64,<data>" — extract only the base64 part
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractTextFromGeminiResponse(raw: unknown): string {
  try {
    const r = raw as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return r?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  } catch {
    return ''
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyzes schedule images using Gemini Vision API.
 * Requirements 2.1–2.7
 */
export async function analyzeScheduleImages(
  files: File[],
  language: 'en' | 'ru' = 'ru',
): Promise<GeminiResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // Convert all files to base64 in parallel
    const base64Parts = await Promise.all(
      files.map(async (file) => ({
        inlineData: {
          mimeType: file.type,
          data: await fileToBase64(file),
        },
      }))
    )

    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            ...base64Parts,
          ],
        },
      ],
    }

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const msg = language === 'ru'
        ? ERROR_MESSAGES.http.ru(response.status)
        : ERROR_MESSAGES.http.en(response.status)
      return { ok: false, error: { code: response.status, message: msg } }
    }

    const raw = await response.json()
    const jsonString = extractTextFromGeminiResponse(raw)

    if (!jsonString) {
      return {
        ok: false,
        error: {
          code: 0,
          message: language === 'ru' ? ERROR_MESSAGES.invalidJson.ru : ERROR_MESSAGES.invalidJson.en,
        },
      }
    }

    const result = parseImportResult(jsonString)
    return { ok: true, data: result }

  } catch (e: unknown) {
    const err = e as Error
    if (err.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 408,
          message: language === 'ru' ? ERROR_MESSAGES.timeout.ru : ERROR_MESSAGES.timeout.en,
        },
      }
    }
    return {
      ok: false,
      error: {
        code: 0,
        message: language === 'ru' ? ERROR_MESSAGES.invalidJson.ru : ERROR_MESSAGES.invalidJson.en,
      },
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
