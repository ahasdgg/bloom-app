# ⚡ БЫСТРЫЙ СТАРТ: Проверка исправления

## 🚀 За 5 минут

### Шаг 1: Запустить dev server
```bash
cd web
npm run dev
```

**Ожидается**: Сервер на http://localhost:5173/

### Шаг 2: Открыть приложение
```
http://localhost:5173/
```

### Шаг 3: Запустить активность
1. 🌱 Discover → получить рекомендацию
2. 🚀 Let's Go! → запустить активность

### Шаг 4: Проверить меню
- ✅ Иконка 🔴 пульсирует?
- ✅ Фон вкладки красный?
- ✅ Наведение показывает название?

### Шаг 5: Проверить синхронизацию
1. Запомнить время на таймере (например, 5:30)
2. Перейти в 🗺️ Path
3. Ждать 10 секунд
4. Вернуться в 🔴 Active
5. ✅ Таймер показывает ~5:40?

### Шаг 6: Проверить завершение
1. Нажать ✓ Finish Activity
2. Дать рейтинг
3. Нажать "Complete Activity ✓"
4. Нажать "View Your Garden"
5. Вернуться в 🔴 Active
6. ✅ Экран пуст?

---

## 🔍 Проверка в консоли

### Открыть DevTools
```
F12 → Console
```

### Проверить состояние
```javascript
// Текущая активность
useAppStore.getState().currentActivity

// Все активные активности
useAppStore.getState().activeActivities

// Текущая рекомендация
useAppStore.getState().currentRecommendation
```

### Проверить автозавершение
```javascript
// Запустить активность на 1 минуту
// Ждать 61 секунду
// Проверить:
useAppStore.getState().activeActivities[0].status  // должно быть 'completed'
useAppStore.getState().currentActivity  // должно быть null
```

---

## 📋 Чеклист (5 минут)

- [ ] Dev server запущен
- [ ] Приложение открыто
- [ ] Активность запущена
- [ ] Иконка 🔴 пульсирует
- [ ] Таймер считает везде
- [ ] Активность завершается
- [ ] Состояние очищается

---

## ❌ Если что-то не работает

### Проблема: Иконка не пульсирует
```javascript
// Проверить в консоли
useAppStore.getState().activeActivities.some(a => a.status === 'active')
// должно быть true
```

### Проблема: Таймер не синхронизируется
```javascript
// Проверить в консоли
const activity = useAppStore.getState().activeActivities[0]
const elapsed = (Date.now() - activity.startedAt) / 1000 / 60
console.log(elapsed)  // должно быть примерно правильное время
```

### Проблема: Активность не завершается
```javascript
// Проверить в консоли
// Запустить активность на 1 минуту
// Ждать 61 секунду
// Проверить:
useAppStore.getState().activeActivities[0].status
// должно быть 'completed'
```

### Проблема: Состояние не очищается
```javascript
// После завершения активности
useAppStore.getState().currentActivity  // должно быть null
useAppStore.getState().activeActivities  // должно быть []
```

---

## 📚 Документация

| Документ | Для кого | Время |
|----------|----------|-------|
| QUICK_START_VERIFICATION.md | Все | 5 мин |
| VERIFICATION_CHECKLIST.md | QA/Тестеры | 15 мин |
| CURRENT_ACTIVITY_STATE_SYNC_TESTING.md | Разработчики | 30 мин |
| EXECUTIVE_SUMMARY.md | Руководство | 10 мин |
| STATE_SYNC_FIX_IMPLEMENTATION_PLAN.md | Архитекторы | 20 мин |
| CURRENT_ACTIVITY_STATE_SYNC_ANALYSIS.md | Аналитики | 25 мин |

---

## ✅ ГОТОВО!

Если все проверки пройдены, система работает корректно.

**Статус**: ✅ **ГОТОВО К ИСПОЛЬЗОВАНИЮ**

