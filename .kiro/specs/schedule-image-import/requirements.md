# Requirements Document

## Introduction

Функция **Schedule Image Import** позволяет пользователям загружать одно или несколько изображений с расписаниями (фото расписания уроков, рабочего календаря, расписания тренировок и т.д.) в Bloom App. AI-ассистент на базе Google Gemini API анализирует изображения, извлекает события, объединяет информацию из нескольких картинок в единое расписание и предлагает пользователю подтвердить импорт. После подтверждения события добавляются в таймлайн (customEvents в Zustand store) и отображаются на экране PathScreen.

## Glossary

- **Schedule_Importer**: компонент пользовательского интерфейса, отвечающий за загрузку изображений и отображение результатов анализа.
- **Gemini_Service**: сервисный модуль, инкапсулирующий взаимодействие с Google Gemini API (модель `gemini-1.5-flash`).
- **Extracted_Event**: объект события, извлечённого из изображения, до его добавления в store.
- **Import_Preview**: экран предварительного просмотра, на котором пользователь просматривает и редактирует Extracted_Event перед импортом.
- **Timeline**: экран PathScreen с таймлайном, хранящий события в `customEvents: CustomEvent[]` в Zustand store.
- **CustomEvent**: существующий интерфейс store: `{ id, title, category, emoji, startTs, endTs, note?, color? }`.
- **Import_Result**: JSON-ответ Gemini_Service, содержащий массив событий, количество обработанных изображений, определённый период и статус.
- **Supported_Category**: одна из допустимых категорий: `study`, `work`, `fitness`, `food`, `culture`, `social`, `relaxation`, `nature`, `family`, `custom`.

---

## Requirements

### Requirement 1: Загрузка изображений расписания

**User Story:** Как пользователь, я хочу загружать одно или несколько изображений с расписаниями, чтобы AI мог автоматически извлечь из них события.

#### Acceptance Criteria

1. THE Schedule_Importer SHALL принимать изображения в форматах JPEG, PNG и WEBP.
2. THE Schedule_Importer SHALL принимать от 1 до 10 изображений за один сеанс импорта.
3. WHEN пользователь выбирает файлы, превышающие 10 МБ каждый, THE Schedule_Importer SHALL отображать сообщение об ошибке «Файл слишком большой. Максимальный размер — 10 МБ» и не добавлять такой файл в очередь.
4. IF пользователь выбирает файл неподдерживаемого формата, THEN THE Schedule_Importer SHALL отображать сообщение «Неподдерживаемый формат. Используйте JPEG, PNG или WEBP» и не добавлять такой файл в очередь.
5. WHEN пользователь добавляет изображения, THE Schedule_Importer SHALL отображать миниатюры всех выбранных изображений с возможностью удалить каждое из них до начала анализа.
6. IF пользователь пытается начать анализ без выбранных изображений, THEN THE Schedule_Importer SHALL отображать подсказку «Добавьте хотя бы одно изображение» и не отправлять запрос.

---

### Requirement 2: Анализ изображений через Gemini API

**User Story:** Как пользователь, я хочу, чтобы AI автоматически распознавал события на изображениях расписания, чтобы мне не приходилось вводить их вручную.

#### Acceptance Criteria

1. WHEN пользователь инициирует анализ, THE Gemini_Service SHALL отправить все выбранные изображения в Google Gemini API в одном запросе с промптом для извлечения событий.
2. WHEN Gemini API возвращает успешный ответ, THE Gemini_Service SHALL распарсить JSON и вернуть Import_Result с полями: `action`, `events[]`, `source_images`, `detected_period`, `status`.
3. THE Gemini_Service SHALL маппировать значение поля `category` из ответа API к одному из Supported_Category; IF значение не совпадает ни с одной Supported_Category, THEN THE Gemini_Service SHALL присвоить категорию `custom`.
4. THE Gemini_Service SHALL конвертировать поля `date`, `start_time`, `end_time` из строкового формата (`"YYYY-MM-DD"`, `"HH:MM"`) в Unix-timestamp (миллисекунды) для полей `startTs` и `endTs` CustomEvent.
5. IF Gemini API возвращает HTTP-ошибку (4xx или 5xx), THEN THE Gemini_Service SHALL вернуть объект ошибки с кодом и читаемым сообщением на языке интерфейса.
6. IF сетевой запрос не завершился в течение 60 секунд, THEN THE Gemini_Service SHALL отменить запрос и вернуть ошибку «Превышено время ожидания ответа от AI».
7. THE Gemini_Service SHALL не логировать и не хранить содержимое изображений после завершения запроса.

---

### Requirement 3: Предварительный просмотр и редактирование извлечённых событий

**User Story:** Как пользователь, я хочу просматривать и редактировать распознанные события перед импортом, чтобы исправить ошибки распознавания.

#### Acceptance Criteria

1. WHEN Gemini_Service возвращает Import_Result со статусом `ready_for_import`, THE Import_Preview SHALL отобразить список всех Extracted_Event с полями: название, дата, время начала, время окончания, категория, местоположение, заметка.
2. THE Import_Preview SHALL отображать информационную строку с количеством распознанных событий и определённым периодом (`detected_period`).
3. WHEN пользователь нажимает на Extracted_Event в списке, THE Import_Preview SHALL открыть форму редактирования с полями: название, категория, дата, время начала, время окончания, заметка.
4. WHEN пользователь сохраняет изменения в форме редактирования, THE Import_Preview SHALL обновить соответствующий Extracted_Event в списке предварительного просмотра без закрытия Import_Preview.
5. THE Import_Preview SHALL позволять пользователю снять отметку с отдельных Extracted_Event, чтобы исключить их из импорта.
6. IF все Extracted_Event сняты с отметки, THEN THE Import_Preview SHALL деактивировать кнопку «Импортировать» и отображать подсказку «Выберите хотя бы одно событие».
7. THE Import_Preview SHALL отображать кнопку «Отмена», закрывающую Import_Preview без сохранения изменений в Timeline.

---

### Requirement 4: Импорт событий в таймлайн

**User Story:** Как пользователь, я хочу одним нажатием добавить все подтверждённые события в таймлайн, чтобы они сразу отображались на экране PathScreen.

#### Acceptance Criteria

1. WHEN пользователь нажимает «Импортировать» в Import_Preview, THE Schedule_Importer SHALL вызвать `addCustomEvent` из Zustand store для каждого отмеченного Extracted_Event.
2. THE Schedule_Importer SHALL генерировать уникальный идентификатор для каждого импортируемого события в формате `import_<timestamp>_<index>`.
3. WHEN импорт завершён успешно, THE Schedule_Importer SHALL отобразить уведомление «Добавлено N событий в таймлайн» и закрыть Import_Preview.
4. WHEN импорт завершён успешно, THE Schedule_Importer SHALL перенаправить пользователя на экран PathScreen (`/path`).
5. IF при добавлении события в store возникает ошибка, THEN THE Schedule_Importer SHALL отобразить сообщение «Не удалось добавить событие: [название события]» и продолжить импорт оставшихся событий.
6. THE Schedule_Importer SHALL маппировать поле `color` из Import_Result в поле `color` CustomEvent; IF поле `color` отсутствует или не является валидным HEX-цветом, THEN THE Schedule_Importer SHALL использовать значение `undefined`.

---

### Requirement 5: Состояния загрузки и обработка ошибок

**User Story:** Как пользователь, я хочу видеть понятную обратную связь во время анализа и при возникновении ошибок, чтобы понимать, что происходит с моим запросом.

#### Acceptance Criteria

1. WHILE Gemini_Service выполняет запрос к API, THE Schedule_Importer SHALL отображать индикатор загрузки и текст «Анализирую расписание...» и блокировать повторную отправку запроса.
2. WHEN анализ завершён успешно, THE Schedule_Importer SHALL скрыть индикатор загрузки и отобразить Import_Preview.
3. IF Gemini_Service возвращает ошибку, THEN THE Schedule_Importer SHALL отобразить сообщение об ошибке с кнопкой «Попробовать снова», которая повторяет запрос с теми же изображениями.
4. IF ответ Gemini API не содержит ни одного события (пустой массив `events`), THEN THE Schedule_Importer SHALL отобразить сообщение «Не удалось распознать события на изображениях. Попробуйте загрузить более чёткое фото».
5. IF ответ Gemini API содержит невалидный JSON, THEN THE Gemini_Service SHALL вернуть ошибку «Некорректный ответ от AI» и THE Schedule_Importer SHALL отобразить её пользователю.

---

### Requirement 6: Интеграция с интерфейсом PathScreen

**User Story:** Как пользователь, я хочу запускать импорт расписания прямо с экрана таймлайна, чтобы не переключаться между разделами приложения.

#### Acceptance Criteria

1. THE PathScreen SHALL отображать кнопку «Импорт из фото» рядом с существующей кнопкой «+ Добавить».
2. WHEN пользователь нажимает «Импорт из фото», THE PathScreen SHALL открыть Schedule_Importer в виде модального окна поверх текущего экрана.
3. WHEN Schedule_Importer закрывается (отмена или успешный импорт), THE PathScreen SHALL обновить список событий таймлайна, отражая актуальное состояние `customEvents` из store.
4. THE PathScreen SHALL отображать импортированные события с визуальным маркером «Импорт» (аналогично существующему маркеру «Моё» для пользовательских событий).

---

### Requirement 7: Парсинг и сериализация данных событий

**User Story:** Как разработчик, я хочу, чтобы парсинг JSON-ответа от Gemini API был надёжным и проверяемым, чтобы данные всегда корректно попадали в store.

#### Acceptance Criteria

1. WHEN Gemini_Service получает строку JSON от API, THE Gemini_Service SHALL распарсить её в объект Import_Result.
2. THE Gemini_Service SHALL валидировать каждое поле Extracted_Event: `date` соответствует формату `YYYY-MM-DD`, `start_time` и `end_time` соответствуют формату `HH:MM`, `title` не является пустой строкой.
3. IF поле `end_time` меньше или равно `start_time` для одного и того же `date`, THEN THE Gemini_Service SHALL установить `endTs = startTs + 3600000` (1 час по умолчанию).
4. THE Pretty_Printer SHALL форматировать объект Import_Result обратно в валидную JSON-строку.
5. FOR ALL валидных объектов Import_Result, парсинг → форматирование → повторный парсинг SHALL производить эквивалентный объект (round-trip свойство).
