# 🎉 Activity Completion Flow

## Overview

После того как пользователь завершил активность, приложение проходит через несколько этапов для отслеживания прогресса и вознаграждения.

---

## 📋 Completion Screen

### Что происходит:

1. **Пользователь нажимает "I Completed It!"** на Bloom экране
2. Переход на экран завершения (`/completion`)
3. Показывается информация о активности

### Элементы экрана:

#### 1. Activity Summary
- Фото активности
- Название
- Локация
- Длительность и стоимость

#### 2. Rating Section ⭐
- 5-звездочная система оценки
- Текст обратной связи в зависимости от рейтинга:
  - 1 звезда: "Not great"
  - 2 звезды: "Could be better"
  - 3 звезды: "Good!"
  - 4 звезды: "Really good!"
  - 5 звезд: "Perfect!"

#### 3. Feedback Section
- Текстовое поле для комментариев
- Опционально (не обязательно)
- Максимум 4 строки

#### 4. Recommendation Section
- Вопрос: "Would you recommend this activity?"
- 3 кнопки: 👍 Yes, 🤔 Maybe, 👎 No
- Цветовая кодировка:
  - Зеленая для "Yes"
  - Желтая для "Maybe"
  - Красная для "No"

#### 5. Submit Button
- "Complete Activity ✓"
- Активна только если выбран рейтинг (1-5 звезд)
- "Skip" кнопка для пропуска

---

## 🎁 Reward System

### После нажатия "Complete Activity":

#### 1. Points Calculation
```
Base Points = Duration / 30
Rating Bonus = Rating * 10
Total Points = Base Points + Rating Bonus
```

**Примеры:**
- 60 мин активность + 5 звезд = 2 + 50 = 52 очка
- 90 мин активность + 3 звезды = 3 + 30 = 33 очка
- 120 мин активность + 4 звезды = 4 + 40 = 44 очка

#### 2. Plant Unlocking
- Каждые 100 очков = новое растение
- Растения: 🌱 → 🌿 → 🌾 → 🌳 → 🌲 → 🎋 → 🌴 → 🌵
- Показывается уведомление при разблокировке

#### 3. Achievement System
Достижения разблокируются при:

| Достижение | Условие | Иконка |
|-----------|---------|--------|
| First Step | Первая активность | 🌱 |
| Growing | 5 активностей | 🌿 |
| Flourishing | 10 активностей | 🌳 |
| Perfect Day | 5-звездочный рейтинг | ⭐ |

#### 4. Reward Screen
Показывается красивый экран с:
- Заголовок: "🎉 Amazing!"
- Подзаголовок: "You completed your activity!"
- Количество заработанных очков (большой шрифт)
- Новое растение (если разблокировано)
- Список достижений
- Статистика:
  - Total Activities
  - Total Points

---

## 📊 Data Storage

### Что сохраняется:

1. **Activity History**
   - Название активности
   - Локация
   - Длительность
   - Стоимость
   - Рейтинг
   - Отзыв
   - Рекомендация (Yes/Maybe/No)
   - Дата и время завершения

2. **Garden Progress**
   - Total Activities (счетчик)
   - Points (сумма всех очков)
   - Plants (список разблокированных растений)
   - Achievements (список достижений)

3. **User Stats**
   - Все данные сохраняются в localStorage
   - Синхронизируются с Zustand store
   - Персистируются между сеансами

---

## 🔄 User Flow

```
Bloom Screen
    ↓
[User clicks "I Completed It!"]
    ↓
Completion Screen
    ├─ Rate activity (1-5 stars)
    ├─ Add feedback (optional)
    ├─ Recommend? (Yes/Maybe/No)
    └─ Click "Complete Activity"
    ↓
Calculate Points & Rewards
    ├─ Base points from duration
    ├─ Bonus from rating
    ├─ Check for plant unlock
    └─ Check for achievements
    ↓
Reward Screen
    ├─ Show points earned
    ├─ Show new plant (if any)
    ├─ Show achievements
    └─ Show stats
    ↓
[User clicks "View Your Garden"]
    ↓
Garden Screen
    ├─ See new plant
    ├─ See updated points
    └─ See achievements
```

---

## 🎮 Interactive Features

### Rating System
- Клик на звезду = выбор рейтинга
- Hover эффект (звезда увеличивается)
- Активные звезды светлее
- Текст обновляется в реальном времени

### Feedback Textarea
- Автоматическое расширение при вводе
- Placeholder текст с подсказкой
- Максимум 4 строки видимого текста

### Recommendation Buttons
- Цветовая кодировка
- Hover эффект (поднимаются вверх)
- Можно выбрать только один

### Animations
- Плавный переход на Reward Screen
- Появление очков с анимацией
- Растение "растет" при разблокировке
- Достижения появляются с задержкой

---

## 📱 Mobile Responsiveness

### На мобильных устройствах:
- Полная ширина экрана
- Увеличенные кнопки для удобства
- Оптимизированные размеры шрифтов
- Вертикальный скролл для длинного контента

### На планшетах:
- Центрированный контент
- Максимальная ширина 600px
- Удобные отступы

### На десктопе:
- Центрированный контент
- Максимальная ширина 600px
- Оптимальная читаемость

---

## 🔗 Integration Points

### Bloom Screen → Completion Screen
```typescript
const handleCompleteActivity = () => {
  navigate('/completion')
}
```

### Completion Screen → Garden Screen
```typescript
const handleContinue = () => {
  store.setCurrentRecommendation(null)
  navigate('/garden')
}
```

### Store Updates
```typescript
store.updateGardenProgress({
  totalActivities: store.gardenProgress.totalActivities + 1,
  points: newTotal,
  achievements: updatedAchievements,
})
```

---

## 🎯 Next Steps

### Для пользователя:
1. ✅ Завершить активность
2. ✅ Оценить опыт
3. ✅ Получить награды
4. ✅ Посмотреть сад
5. ➡️ Получить новую рекомендацию

### Для разработчика:
- [ ] Добавить сохранение отзывов в базу данных
- [ ] Интегрировать с реальным API для рекомендаций
- [ ] Добавить уведомления при разблокировке достижений
- [ ] Создать экран статистики
- [ ] Добавить экспорт истории активностей

---

## 📊 Example Data

### Completed Activity
```json
{
  "id": "completed_1714569600000",
  "activity": {
    "name": "Mountain Hiking",
    "location": "Rocky Mountains",
    "duration": 180,
    "cost": "free",
    "category": "hiking"
  },
  "rating": 5,
  "feedback": "Amazing views and great exercise!",
  "recommendation": "yes",
  "pointsEarned": 56,
  "completedAt": "2026-05-01T14:30:00Z"
}
```

### Updated Garden Progress
```json
{
  "totalActivities": 6,
  "points": 287,
  "plants": ["🌱", "🌿", "🌾"],
  "achievements": [
    "first_activity",
    "five_activities",
    "perfect_rating"
  ]
}
```

---

## 🎨 Design System

### Colors
- **Success Green**: #90ee90 (для "Yes" и новых растений)
- **Warning Yellow**: #ffd700 (для "Maybe")
- **Error Red**: #ff6b6b (для "No")
- **Primary Gold**: #b8944e (для очков)

### Typography
- **Title**: 28px, bold
- **Subtitle**: 18px, regular
- **Label**: 14px, medium
- **Value**: 24px, bold

### Spacing
- **Section Gap**: 20px
- **Item Gap**: 12px
- **Padding**: 16-20px

---

**Готово к использованию! 🚀**
