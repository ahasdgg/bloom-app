# Implementation Plan: Schedule Image Import

## Overview

Реализация функции импорта расписания из фотографий через Google Gemini Vision API.
Новые файлы: `geminiService.ts`, `ScheduleImporter.tsx`, `ScheduleImporter.css`.
Изменения: `PathScreen.tsx`, `PathScreen.css`.

## Tasks

- [x] 1. Создать geminiService.ts — Gemini API клиент и утилиты
  - Реализовать типы: `GeminiRawEvent`, `ImportResult`, `GeminiError`, `GeminiResponse`
  - Реализовать утилиты: `isValidHexColor`, `mapCategory`, `validateExtractedEvent`, `convertToTimestamps`, `prettyPrintImportResult`, `parseImportResult`
  - Реализовать `analyzeScheduleImages(files, language)` с AbortController (60 сек таймаут)
  - Передавать изображения как `inlineData` (base64) в массиве `parts`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 1.1 Написать property-тест для валидации файлов (Property 1)
    - **Property 1: Валидация файлов — формат и размер**
    - **Validates: Requirements 1.1, 1.3, 1.4**

  - [ ]* 1.2 Написать property-тест для ограничения количества файлов (Property 2)
    - **Property 2: Ограничение количества файлов**
    - **Validates: Requirements 1.2, 1.6**

  - [ ]* 1.3 Написать property-тест round-trip парсинга ImportResult (Property 4)
    - **Property 4: Round-trip парсинга Import_Result**
    - **Validates: Requirements 2.2, 7.1, 7.4, 7.5**

  - [ ]* 1.4 Написать property-тест маппинга категорий (Property 5)
    - **Property 5: Маппинг категорий**
    - **Validates: Requirements 2.3**

  - [ ]* 1.5 Написать property-тест конвертации дат и времён (Property 6)
    - **Property 6: Конвертация дат и времён в timestamp**
    - **Validates: Requirements 2.4, 7.3**

  - [ ]* 1.6 Написать property-тест обработки ошибок Gemini Service (Property 7)
    - **Property 7: Обработка ошибок Gemini Service**
    - **Validates: Requirements 2.5, 5.3, 5.5**

  - [ ]* 1.7 Написать property-тест валидации HEX-цвета (Property 10)
    - **Property 10: Валидация HEX-цвета**
    - **Validates: Requirements 4.6**

- [x] 2. Создать ScheduleImporter.css — стили компонента
  - Bottom sheet (как EventForm в PathScreen.css)
  - Фазы: upload, loading, preview, error
  - Миниатюры изображений, чекбоксы событий, спиннер
  - Использовать CSS переменные: --accent, --bg, --border, --radius-m, --surface и т.д.
  - _Requirements: 5.1, 5.2, 5.3, 6.2_

- [x] 3. Создать ScheduleImporter.tsx — модальный компонент
  - [x] 3.1 Реализовать фазу `upload`: выбор файлов, миниатюры, валидация, кнопка «Анализировать»
    - Принимать JPEG, PNG, WEBP; максимум 10 файлов, 10 МБ каждый
    - Показывать сообщения об ошибках валидации
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 3.2 Реализовать фазу `loading`: спиннер + «Анализирую расписание...»
    - Блокировать повторную отправку
    - _Requirements: 5.1_

  - [x] 3.3 Реализовать фазу `preview`: список событий с чекбоксами
    - Показывать поля: название, дата, время, категория, местоположение, заметка
    - Информационная строка с количеством событий и detected_period
    - Кнопка «Импортировать» (деактивируется если все сняты)
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7_

  - [x] 3.4 Реализовать импорт: вызов addCustomEvent для каждого отмеченного события
    - ID формата `import_<timestamp>_<index>`
    - navigate("/path") после успешного импорта
    - Обработка ошибок store (продолжать при ошибке одного события)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.5 Реализовать фазу `error`: сообщение + кнопка «Попробовать снова»
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 3.6 Написать property-тест импорта только отмеченных событий (Property 8)
    - **Property 8: Импорт только отмеченных событий**
    - **Validates: Requirements 3.5, 4.1**

  - [ ]* 3.7 Написать property-тест уникальности и формата ID (Property 9)
    - **Property 9: Уникальность и формат ID импортированных событий**
    - **Validates: Requirements 4.2**

  - [ ]* 3.8 Написать property-тест соответствия миниатюр файлам (Property 3)
    - **Property 3: Соответствие миниатюр выбранным файлам**
    - **Validates: Requirements 1.5**

- [ ] 4. Checkpoint — убедиться что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Изменить PathScreen.css — добавить стили кнопки импорта
  - Стиль `.import-photo-btn` рядом с `.add-event-btn`
  - _Requirements: 6.1_

- [x] 6. Изменить PathScreen.tsx — интеграция ScheduleImporter
  - [x] 6.1 Добавить кнопку «Импорт из фото» рядом с «+ Добавить» (в обоих местах: empty state и основной экран)
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Добавить state `showImporter` и рендер `<ScheduleImporter>` как модал
    - _Requirements: 6.2, 6.3_

  - [x] 6.3 Добавить badge «Импорт» для событий с `id.startsWith("import_")`
    - В flow-card (таймлайн сегодня) и history-card (история)
    - _Requirements: 6.4_

- [x] 7. Final checkpoint — убедиться что всё работает
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Property-тесты используют библиотеку `fast-check`
- Импортированные события идентифицируются по `id.startsWith("import_")`
