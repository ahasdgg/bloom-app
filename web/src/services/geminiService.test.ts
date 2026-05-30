import {
  validateFile,
  mapCategory,
  isValidHexColor,
  validateExtractedEvent,
  convertToTimestamps,
  parseImportResult,
} from './geminiService'

describe('geminiService utilities', () => {
  test('validateFile rejects unsupported formats and size overflow', () => {
    expect(validateFile({ type: 'text/plain', size: 100 })).toEqual({
      valid: false,
      error: 'Неподдерживаемый формат. Используйте JPEG, PNG или WEBP',
    })

    expect(validateFile({ type: 'image/png', size: 20 * 1024 * 1024 })).toEqual({
      valid: false,
      error: 'Файл слишком большой. Максимальный размер — 10 МБ',
    })
  })

  test('mapCategory normalizes category names and falls back to custom', () => {
    expect(mapCategory('fitness')).toBe('fitness')
    expect(mapCategory('Personal')).toBe('custom')
    expect(mapCategory(undefined)).toBe('custom')
  })

  test('isValidHexColor validates hex strings', () => {
    expect(isValidHexColor('#fff')).toBe(true)
    expect(isValidHexColor('#abc123')).toBe(true)
    expect(isValidHexColor('rgb(255,255,255)')).toBe(false)
  })

  test('validateExtractedEvent checks required event fields', () => {
    expect(
      validateExtractedEvent({
        date: '2026-05-31',
        start_time: '09:00',
        end_time: '10:00',
        title: 'Morning walk',
      }),
    ).toBe(true)

    expect(
      validateExtractedEvent({
        date: '2026-05-31',
        start_time: '09:00',
        end_time: '10:00',
        title: '',
      }),
    ).toBe(false)
  })

  test('convertToTimestamps handles end time before start time', () => {
    const { startTs, endTs } = convertToTimestamps('2026-05-31', '12:00', '11:00')
    expect(endTs).toBe(startTs + 3_600_000)
  })

  test('parseImportResult accepts JSON wrapped in markdown', () => {
    const result = parseImportResult(
      '```json\n{"action":"import","events":[],"source_images":1,"detected_period":"week","status":"ready_for_import"}\n```',
    )
    // parseImportResult returns an ImportResult object
    expect(result.status).toBe('ready_for_import')
    expect(result.source_images).toBe(1)
  })
})
