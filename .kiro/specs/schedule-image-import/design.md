# Design Document: Schedule Image Import

## Overview

Функция **Schedule Image Import** добавляет в Bloom App возможность загружать фотографии расписаний и автоматически извлекать из них события с помощью Google Gemini Vision API. Пользователь выбирает одно или несколько изображений, AI анализирует их и возвращает структурированный список событий. Пользователь просматривает, редактирует и подтверждает импорт — после чего события появляются в таймлайне PathScreen как `CustomEvent` в Zustand store.

### Ключевые цели

- Минимальное трение: один клик на PathScreen → загрузка → подтверждение → события в таймлайне.
- Надёжный парсинг: строгая валидация JSON-ответа Gemini, корректная конвертация дат/времён.
- Соответствие существующей архитектуре: новые файлы не нарушают текущую структуру `web/src/`.

---

## Architecture

### Компонентная диаграмма

```mermaid
graph TD
    PS[PathScreen] -->|открывает модал| SI[ScheduleImporter]
    SI -->|вызывает| GS[geminiService]
    GS -->|HTTP POST| GA[Google Gemini API]
    GA -->|JSON ответ| GS
    GS -->|ImportResult| SI
    SI -->|addCustomEvent x N| ZS[Zustand Store]
    ZS -->|customEvents| PS
```

### Поток данных

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant PS as PathScreen
    participant SI as ScheduleImporter
    participant GS as geminiService
    participant API as Gemini API
    participant Store as Zustand Store

    U->>PS: нажимает "Импорт из фото"
    PS->>SI: открывает модал (showImporter=true)
    U->>SI: выбирает 1-10 изображений
    SI->>SI: валидация файлов (формат, размер)
    U->>SI: нажимает "Анализировать"
    SI->>GS: analyzeScheduleImages(files[])
    GS->>API: POST /generateContent (base64 images + prompt)
    API-->>GS: JSON строка с событиями
    GS->>GS: parseImportResult(jsonString)
    GS->>GS: validateAndNormalizeEvents(events[])
    GS-->>SI: ImportResult
    SI->>U: показывает Import_Preview
    U->>SI: редактирует/снимает отметки
    U->>SI: нажимает "Импортировать"
    SI->>Store: addCustomEvent() × N
    SI->>PS: закрывает модал, navigate("/path")
```

### Файловая структура

```
web/src/
├── services/
│   └── geminiService.ts          # новый: Gemini API клиент + парсинг
├── components/
│   ├── ScheduleImporter.tsx      # новый: модальный компонент
│   └── ScheduleImporter.css      # новый: стили
└── screens/
    ├── PathScreen.tsx            # изменение: кнопка + модал
    └── PathScreen.css            # изменение: стили кнопки импорта
```

---

## Components and Interfaces

### geminiService.ts

Сервис инкапсулирует всё взаимодействие с Gemini API. Экспортирует одну публичную функцию и вспомогательные утилиты для тестирования.

```typescript
// Типы ответа Gemini
export interface GeminiRawEvent {
  date: string          // "YYYY-MM-DD"
  start_time: string    // "HH:MM"
  end_time: string      // "HH:MM"
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

// Публичный API
export async function analyzeScheduleImages(
  files: File[],
  language: 'en' | 'ru'
): Promise<GeminiResponse>

// Утилиты (экспортируются для тестирования)
export function parseImportResult(jsonString: string): ImportResult
export function mapCategory(raw: string | undefined): SupportedCategory
export function isValidHexColor(value: string | undefined): boolean
export function validateExtractedEvent(event: GeminiRawEvent): boolean
export function convertToTimestamps(
  date: string,
  startTime: string,
  endTime: string
): { startTs: number; endTs: number }
export function prettyPrintImportResult(result: ImportResult): string
```

**Системный промпт для Gemini:**
```
Ты — интеллектуальный ассистент Bloom App. Проанализируй изображения расписаний и верни ТОЛЬКО чистый JSON без дополнительного текста в формате: {action, events:[{date,start_time,end_time,title,location,teacher,notes,color,category}], source_images, detected_period, status}
```

**Конфигурация:**
- API Key: `AIzaSyCpylP_3TS0kWAQSdHVWcxwxotoifsgfx0`
- Модель: `gemini-1.5-flash`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Таймаут: 60 секунд (через `AbortController`)
- Изображения передаются как `inlineData` (base64) в массиве `parts`

### ScheduleImporter.tsx

Модальный компонент с тремя внутренними состояниями (фазами):

```typescript
type ImportPhase = 'upload' | 'loading' | 'preview' | 'error'

interface ExtractedEvent {
  // Нормализованное событие после парсинга
  id: string              // временный ID для preview
  title: string
  category: SupportedCategory
  emoji: string
  startTs: number
  endTs: number
  note: string
  color?: string
  // Дополнительные поля из Gemini для отображения
  location?: string
  teacher?: string
  checked: boolean        // включён ли в импорт
}

interface ScheduleImporterProps {
  onClose: () => void
  isRu: boolean
}
```

**Фазы компонента:**

| Фаза | Описание |
|------|----------|
| `upload` | Выбор файлов, миниатюры, кнопка «Анализировать» |
| `loading` | Спиннер + текст «Анализирую расписание...», кнопки заблокированы |
| `preview` | Список ExtractedEvent с чекбоксами, редактирование, кнопка «Импортировать» |
| `error` | Сообщение об ошибке + кнопка «Попробовать снова» |

### PathScreen.tsx — изменения

Добавляется кнопка «Импорт из фото» рядом с существующей кнопкой «+ Добавить»:

```tsx
// В заголовке PathScreen
<button className="import-photo-btn" onClick={() => setShowImporter(true)}>
  📷 {isRu ? "Импорт из фото" : "Import from photo"}
</button>

// Модал
{showImporter && (
  <ScheduleImporter
    onClose={() => setShowImporter(false)}
    isRu={isRu}
  />
)}
```

Импортированные события отображаются с маркером «Импорт» (аналогично «Моё»): события с `id.startsWith('import_')` получают badge `"Импорт"` / `"Import"`.

---

## Data Models

### SupportedCategory

```typescript
export type SupportedCategory =
  | 'study' | 'work' | 'fitness' | 'food'
  | 'culture' | 'social' | 'relaxation'
  | 'nature' | 'family' | 'custom'
```

### Маппинг категорий из Gemini

| Значение от Gemini | Mapped category |
|--------------------|-----------------|
| `"study"` | `"study"` |
| `"work"` | `"work"` |
| `"fitness"` | `"fitness"` |
| `"food"` | `"food"` |
| `"culture"` | `"culture"` |
| `"social"` | `"social"` |
| `"relaxation"` | `"relaxation"` |
| `"nature"` | `"nature"` |
| `"family"` | `"family"` |
| `"personal"` | `"custom"` |
| `"other"` | `"custom"` |
| любое другое | `"custom"` |

### Emoji по категории

```typescript
const CATEGORY_EMOJI: Record<SupportedCategory, string> = {
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
```

### ID формат для импортированных событий

```
import_<timestamp>_<index>
// Пример: import_1704067200000_0, import_1704067200000_1
```

### Валидация файлов

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 МБ
const MAX_FILES = 10
const MIN_FILES = 1
```

### Конвертация времени

```typescript
// date: "YYYY-MM-DD", time: "HH:MM"
// Возвращает Unix timestamp в миллисекундах
function tsFromDateAndTime(date: string, time: string): number {
  return new Date(`${date}T${time}:00`).getTime()
}

// Если end_time <= start_time → endTs = startTs + 3_600_000
```

### Структура запроса к Gemini API

```typescript
{
  contents: [{
    parts: [
      { text: SYSTEM_PROMPT },
      // для каждого файла:
      {
        inlineData: {
          mimeType: file.type,  // "image/jpeg" | "image/png" | "image/webp"
          data: base64String    // btoa(binaryString)
        }
      }
    ]
  }]
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Перед написанием свойств выполним анализ на избыточность:

- **1.1 и 1.4** — оба тестируют валидацию формата файла. 1.4 — это error-message сторона 1.1. Объединяем в одно свойство «валидация файла».
- **2.2 и 7.1, 7.4, 7.5** — все тестируют парсинг/сериализацию Import_Result. Объединяем в одно round-trip свойство.
- **4.1 и 4.3** — оба тестируют импорт N событий. 4.3 (уведомление с N) подразумевает 4.1 (N вызовов). Объединяем.
- **3.4 и 3.5** — редактирование одного события и выбор подмножества — разные аспекты, оставляем отдельно.
- **5.3 и 5.5** — оба про обработку ошибок. 5.5 — частный случай 5.3. Объединяем.

После рефлексии получаем 10 уникальных свойств.

---

### Property 1: Валидация файлов — формат и размер

*For any* файла, переданного в валидатор Schedule_Importer, файл принимается тогда и только тогда, когда его MIME-тип входит в `{image/jpeg, image/png, image/webp}` И его размер не превышает 10 МБ.

**Validates: Requirements 1.1, 1.3, 1.4**

---

### Property 2: Ограничение количества файлов

*For any* массива файлов длиной N, переданного в валидатор, анализ разрешается запустить тогда и только тогда, когда 1 ≤ N ≤ 10.

**Validates: Requirements 1.2, 1.6**

---

### Property 3: Соответствие миниатюр выбранным файлам

*For any* набора из N валидных файлов, добавленных в Schedule_Importer, количество отображаемых миниатюр равно N.

**Validates: Requirements 1.5**

---

### Property 4: Round-trip парсинга Import_Result

*For any* валидного объекта `ImportResult`, операция `parseImportResult(prettyPrintImportResult(result))` должна производить объект, эквивалентный исходному (по всем полям).

**Validates: Requirements 2.2, 7.1, 7.4, 7.5**

---

### Property 5: Маппинг категорий

*For any* строки `category`, переданной в `mapCategory()`, результат всегда является одним из значений `SupportedCategory`. Для строк из множества `{study, work, fitness, food, culture, social, relaxation, nature, family}` результат совпадает с входным значением; для всех остальных строк результат равен `"custom"`.

**Validates: Requirements 2.3**

---

### Property 6: Конвертация дат и времён в timestamp

*For any* валидной строки даты формата `YYYY-MM-DD` и строки времени формата `HH:MM`, функция `convertToTimestamps` возвращает `startTs` и `endTs` такие, что `new Date(startTs)` соответствует указанной дате и времени начала. Если `end_time ≤ start_time`, то `endTs = startTs + 3_600_000`.

**Validates: Requirements 2.4, 7.3**

---

### Property 7: Обработка ошибок Gemini Service

*For any* ответа от Gemini API с HTTP-статусом в диапазоне 4xx–5xx, а также для любой строки, не являющейся валидным JSON, `analyzeScheduleImages` возвращает `{ ok: false, error: { code, message } }` с непустым полем `message`.

**Validates: Requirements 2.5, 5.3, 5.5**

---

### Property 8: Импорт только отмеченных событий

*For any* набора из N событий в Import_Preview, где K из них отмечены (checked=true), нажатие «Импортировать» вызывает `addCustomEvent` ровно K раз — по одному разу для каждого отмеченного события и ни разу для снятых с отметки.

**Validates: Requirements 3.5, 4.1**

---

### Property 9: Уникальность и формат ID импортированных событий

*For any* пакета из N событий, импортированных за один сеанс, все N сгенерированных идентификаторов уникальны и соответствуют регулярному выражению `/^import_\d+_\d+$/`.

**Validates: Requirements 4.2**

---

### Property 10: Валидация HEX-цвета

*For any* строки `color` из ответа Gemini, функция `isValidHexColor(color)` возвращает `true` тогда и только тогда, когда строка соответствует формату `#RRGGBB` или `#RGB`. Для всех остальных значений (включая `undefined`, пустую строку, произвольный текст) возвращается `false`, и в `CustomEvent.color` записывается `undefined`.

**Validates: Requirements 4.6**

---

## Error Handling

### Категории ошибок

| Категория | Условие | Сообщение (RU) | Действие |
|-----------|---------|----------------|----------|
| Формат файла | MIME не в списке | «Неподдерживаемый формат. Используйте JPEG, PNG или WEBP» | Файл не добавляется |
| Размер файла | > 10 МБ | «Файл слишком большой. Максимальный размер — 10 МБ» | Файл не добавляется |
| Нет файлов | 0 файлов при запуске | «Добавьте хотя бы одно изображение» | Запрос не отправляется |
| HTTP 4xx/5xx | Ошибка API | «Ошибка API: [код]» | Показать с кнопкой «Попробовать снова» |
| Таймаут | > 60 сек | «Превышено время ожидания ответа от AI» | Показать с кнопкой «Попробовать снова» |
| Невалидный JSON | Ответ не парсится | «Некорректный ответ от AI» | Показать с кнопкой «Попробовать снова» |
| Пустые события | `events.length === 0` | «Не удалось распознать события на изображениях. Попробуйте загрузить более чёткое фото» | Показать без кнопки повтора |
| Ошибка store | `addCustomEvent` бросает | «Не удалось добавить событие: [название]» | Продолжить импорт остальных |

### Стратегия обработки в geminiService

```typescript
// Псевдокод
async function analyzeScheduleImages(files, language) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60_000)

  try {
    const base64Parts = await Promise.all(files.map(fileToBase64Part))
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify(buildRequest(base64Parts))
    })

    if (!response.ok) {
      return { ok: false, error: { code: response.status, message: getErrorMessage(response.status, language) } }
    }

    const raw = await response.json()
    const jsonString = extractTextFromGeminiResponse(raw)
    const result = parseImportResult(jsonString)  // throws on invalid JSON
    return { ok: true, data: result }

  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: { code: 408, message: TIMEOUT_MSG[language] } }
    }
    return { ok: false, error: { code: 0, message: INVALID_JSON_MSG[language] } }
  } finally {
    clearTimeout(timeoutId)
  }
}
```

---

## Testing Strategy

### Подход

Используется **двойная стратегия тестирования**:
- **Unit-тесты** — конкретные примеры, граничные случаи, интеграция компонентов
- **Property-based тесты** — универсальные свойства через `fast-check` (TypeScript)

Библиотека PBT: **[fast-check](https://github.com/dubzzz/fast-check)** — зрелая PBT-библиотека для TypeScript/JavaScript.

Каждый property-тест запускается минимум **100 итераций** (по умолчанию в fast-check).

### Структура тестов

```
web/src/
└── services/
    └── geminiService.test.ts     # unit + property тесты сервиса
web/src/
└── components/
    └── ScheduleImporter.test.tsx # unit тесты компонента
```

### Property-Based Tests (fast-check)

Каждый тест помечен тегом: `// Feature: schedule-image-import, Property N: <text>`

**Property 1 — Валидация файлов:**
```typescript
// Feature: schedule-image-import, Property 1: file validation by format and size
fc.assert(fc.property(
  fc.record({
    type: fc.string(),
    size: fc.nat({ max: 20 * 1024 * 1024 })
  }),
  ({ type, size }) => {
    const isValidType = ALLOWED_TYPES.includes(type)
    const isValidSize = size <= MAX_FILE_SIZE
    const result = validateFile({ type, size } as File)
    return result.valid === (isValidType && isValidSize)
  }
))
```

**Property 4 — Round-trip парсинга:**
```typescript
// Feature: schedule-image-import, Property 4: ImportResult parse round-trip
fc.assert(fc.property(
  arbitraryImportResult(),  // кастомный арбитрарий
  (result) => {
    const serialized = prettyPrintImportResult(result)
    const reparsed = parseImportResult(serialized)
    return deepEqual(result, reparsed)
  }
))
```

**Property 5 — Маппинг категорий:**
```typescript
// Feature: schedule-image-import, Property 5: category mapping always returns SupportedCategory
fc.assert(fc.property(
  fc.oneof(fc.string(), fc.constant(undefined)),
  (category) => {
    const result = mapCategory(category)
    return SUPPORTED_CATEGORIES.includes(result)
  }
))
```

**Property 6 — Конвертация timestamp:**
```typescript
// Feature: schedule-image-import, Property 6: date/time to timestamp conversion
fc.assert(fc.property(
  arbitraryDateString(),   // "YYYY-MM-DD"
  arbitraryTimeString(),   // "HH:MM"
  arbitraryTimeString(),
  (date, startTime, endTime) => {
    const { startTs, endTs } = convertToTimestamps(date, startTime, endTime)
    if (endTime <= startTime) {
      return endTs === startTs + 3_600_000
    }
    return endTs > startTs && startTs === new Date(`${date}T${startTime}:00`).getTime()
  }
))
```

**Property 8 — Импорт только отмеченных:**
```typescript
// Feature: schedule-image-import, Property 8: only checked events are imported
fc.assert(fc.property(
  fc.array(arbitraryExtractedEvent(), { minLength: 1, maxLength: 10 }),
  (events) => {
    const checked = events.filter(e => e.checked)
    const addCustomEvent = jest.fn()
    importEvents(events, addCustomEvent)
    return addCustomEvent.mock.calls.length === checked.length
  }
))
```

**Property 9 — Уникальность ID:**
```typescript
// Feature: schedule-image-import, Property 9: imported event IDs are unique and match format
fc.assert(fc.property(
  fc.array(arbitraryExtractedEvent(), { minLength: 1, maxLength: 10 }),
  (events) => {
    const ids = generateImportIds(events.length)
    const allUnique = new Set(ids).size === ids.length
    const allMatch = ids.every(id => /^import_\d+_\d+$/.test(id))
    return allUnique && allMatch
  }
))
```

**Property 10 — Валидация HEX:**
```typescript
// Feature: schedule-image-import, Property 10: HEX color validation
fc.assert(fc.property(
  fc.oneof(fc.string(), fc.constant(undefined)),
  (color) => {
    const result = isValidHexColor(color)
    if (color === undefined) return result === false
    const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
    return result === isHex
  }
))
```

### Unit Tests

- `validateFile()` — граничные случаи: ровно 10 МБ, 10 МБ + 1 байт, неизвестный MIME
- `parseImportResult()` — невалидный JSON, пустой массив events, отсутствующие поля
- `analyzeScheduleImages()` — мок HTTP 429, мок таймаута, мок пустого ответа
- `ScheduleImporter` — рендер фаз upload/loading/preview/error, кнопка «Попробовать снова»
- `PathScreen` — наличие кнопки «Импорт из фото», открытие модала

### Integration Tests

- Полный флоу: загрузка файлов → мок Gemini ответа → preview → импорт → проверка store
- Проверка навигации на `/path` после успешного импорта
