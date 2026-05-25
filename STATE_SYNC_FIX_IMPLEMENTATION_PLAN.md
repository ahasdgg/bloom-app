# 🔧 ПЛАН РЕАЛИЗАЦИИ: Исправление синхронизации состояния `currentActivity`

## ФАЗА 1: Расширение Store (web/src/store.ts)

### Шаг 1.1: Добавить `currentActivity` в AppState

```typescript
export interface AppState {
  // ... существующие поля ...
  
  // ✅ НОВОЕ: Текущая активность пользователя
  currentActivity: ActiveActivity | null
  
  // ✅ НОВЫЕ методы
  setCurrentActivity: (activity: ActiveActivity | null) => void
  clearCurrentActivity: () => void
  
  // ✅ НОВЫЙ: Глобальная синхронизация
  globalSyncActiveActivities: () => void
}
```

### Шаг 1.2: Реализовать методы

```typescript
setCurrentActivity: (activity: ActiveActivity | null) => {
  set({ currentActivity: activity })
},

clearCurrentActivity: () => {
  set({ currentActivity: null })
},

globalSyncActiveActivities: () => {
  // Принудительная синхронизация при навигации
  const activities = get().activeActivities
  set({ activeActivities: [...activities] })
},
```

### Шаг 1.3: Улучшить `checkExpiredActivities()`

**ТЕКУЩАЯ ЛОГИКА** (❌ НЕПРАВИЛЬНАЯ):
```typescript
checkExpiredActivities: () => {
  const activities = get().activeActivities
  const now = Date.now()

  const updated = activities.map(activity => {
    if (activity.status !== 'active') return activity  // ← Пропускаем неактивные

    const elapsedMs = now - activity.startedAt
    const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60)

    if (elapsedMinutes >= activity.duration) {
      return { ...activity, status: 'completed' as const }  // ← Только меняем статус
    }

    return activity
  })

  set({ activeActivities: updated })
}
```

**НОВАЯ ЛОГИКА** (✅ ПРАВИЛЬНАЯ):
```typescript
checkExpiredActivities: () => {
  const activities = get().activeActivities
  const currentActivity = get().currentActivity
  const now = Date.now()

  const updated = activities.map(activity => {
    if (activity.status !== 'active') return activity

    const elapsedMs = now - activity.startedAt
    const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60)

    // Если время истекло, завершаем активность
    if (elapsedMinutes >= activity.duration) {
      // Если это текущая активность, очищаем её
      if (currentActivity?.id === activity.id) {
        get().clearCurrentActivity()
      }
      return { ...activity, status: 'completed' as const }
    }

    return activity
  })

  set({ activeActivities: updated })
},
```

---

## ФАЗА 2: Обновить ActiveScreen.tsx

### Шаг 2.1: Использовать `currentActivity` из store

**ТЕКУЩИЙ КОД** (❌):
```typescript
export default function ActiveScreen() {
  const navigate = useNavigate()
  const store = useAppStore()
  const activeActivities = store.activeActivities  // ← Весь список
  
  // ... логика ...
}
```

**НОВЫЙ КОД** (✅):
```typescript
export default function ActiveScreen() {
  const navigate = useNavigate()
  const store = useAppStore()
  const activeActivities = store.activeActivities
  const currentActivity = store.currentActivity  // ← Текущая активность
  
  // Синхронизация при входе на экран
  useEffect(() => {
    store.globalSyncActiveActivities()
  }, [store])
  
  // ... остальная логика ...
}
```

### Шаг 2.2: Обновить `handleAutoComplete()`

**ТЕКУЩИЙ КОД** (❌):
```typescript
const handleAutoComplete = useCallback(
  (activity: ActiveActivity) => {
    store.setCurrentRecommendation({...})
    store.cancelActivity(activity.id)
    navigate('/completion')
  },
  [store, navigate]
)
```

**НОВЫЙ КОД** (✅):
```typescript
const handleAutoComplete = useCallback(
  (activity: ActiveActivity) => {
    // 1. Создаём рекомендацию для экрана завершения
    store.setCurrentRecommendation({
      id: activity.id,
      activity: {
        name: activity.name,
        description: `You completed ${activity.name}`,
        category: 'adventure',
        location: {
          name: activity.location,
          latitude: 0,
          longitude: 0,
        },
        duration: activity.duration,
        difficulty: 'medium',
        cost: activity.cost,
        indoor: false,
        imageUrl: activity.imageUrl,
      },
      relevanceScore: 0.9,
      reasoning: 'Great job completing this activity!',
      contextSnapshot: {
        temperature: 22,
        weather: 'Sunny',
        timeOfDay: 'Afternoon',
        availableTime: 120,
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    })

    // 2. Завершаем активность в store
    store.completeActivity(activity.id)
    
    // 3. Очищаем текущую активность (ЖЁСТКИЙ СБРОС)
    store.clearCurrentActivity()
    
    // 4. Удаляем из списка активных
    store.cancelActivity(activity.id)

    // 5. Переходим на экран завершения
    navigate('/completion')
  },
  [store, navigate]
)
```

### Шаг 2.3: Обновить обработчик кнопки "Finish"

```typescript
const handleFinish = (activityId: string) => {
  const activity = activeActivities.find(a => a.id === activityId)
  if (activity) {
    // Устанавливаем как текущую перед завершением
    store.setCurrentActivity(activity)
    handleAutoComplete(activity)
  }
}
```

---

## ФАЗА 3: Обновить Navigation.tsx

### Шаг 3.1: Подписать Navigation на store

**ТЕКУЩИЙ КОД** (❌):
```typescript
const Navigation: React.FC = () => {
  const location = useLocation()  // ← Только маршрут

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navigation">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <span className="nav-icon">🌱</span>
        <span className="nav-label">Discover</span>
      </Link>
      {/* ... */}
    </nav>
  )
}
```

**НОВЫЙ КОД** (✅):
```typescript
import { useAppStore } from '../store'

const Navigation: React.FC = () => {
  const location = useLocation()
  const store = useAppStore()
  
  // Подписываемся на активности
  const hasActiveActivities = store.activeActivities.some(a => a.status === 'active')
  const currentActivity = store.currentActivity

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navigation">
      <Link
        to="/"
        className={`nav-item ${isActive('/') ? 'active' : ''}`}
        title="Discover"
      >
        <span className="nav-icon">🌱</span>
        <span className="nav-label">Discover</span>
      </Link>
      
      {/* ✅ ОБНОВЛЕНО: Иконка реагирует на активность */}
      <Link
        to="/active"
        className={`nav-item ${isActive('/active') ? 'active' : ''} ${
          hasActiveActivities ? 'has-active' : ''
        }`}
        title={currentActivity ? `Active: ${currentActivity.name}` : 'Active'}
      >
        <span className={`nav-icon ${hasActiveActivities ? 'pulse' : ''}`}>
          {hasActiveActivities ? '🔴' : '⭕'}
        </span>
        <span className="nav-label">Active</span>
      </Link>
      
      {/* ... остальные ссылки ... */}
    </nav>
  )
}
```

### Шаг 3.2: Добавить CSS для пульсирующей иконки

```css
.nav-icon.pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.nav-item.has-active {
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: 8px;
}
```

---

## ФАЗА 4: Обновить App.tsx (Глобальный жизненный цикл)

### Шаг 4.1: Добавить глобальный таймер

**ТЕКУЩИЙ КОД** (❌):
```typescript
function App() {
  const store = useAppStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!store.userId) {
      store.setUserId('user_' + Date.now())
    }
    setIsInitialized(true)
  }, [store])

  // ... нет глобального таймера
}
```

**НОВЫЙ КОД** (✅):
```typescript
import { useLocation } from 'react-router-dom'

function App() {
  const store = useAppStore()
  const location = useLocation()
  const [isInitialized, setIsInitialized] = useState(false)

  // Инициализация
  useEffect(() => {
    if (!store.userId) {
      store.setUserId('user_' + Date.now())
    }
    setIsInitialized(true)
  }, [store])

  // ✅ НОВОЕ: Глобальный таймер (работает везде)
  useEffect(() => {
    const interval = setInterval(() => {
      store.checkExpiredActivities()
    }, 1000)

    return () => clearInterval(interval)
  }, [store])

  // ✅ НОВОЕ: Синхронизация при навигации
  useEffect(() => {
    store.globalSyncActiveActivities()
  }, [location, store])

  // ... остальной код ...
}
```

---

## ФАЗА 5: Обновить BloomScreen.tsx

### Шаг 5.1: Установить `currentActivity` при запуске

**ТЕКУЩИЙ КОД** (❌):
```typescript
const handleBook = () => {
  if (store.currentRecommendation) {
    const activity = store.currentRecommendation.activity
    store.startActivity({
      id: 'active_' + Date.now(),
      name: activity.name,
      location: activity.location.name,
      duration: activity.duration,
      cost: activity.cost,
      startedAt: Date.now(),
      imageUrl: activity.imageUrl,
      status: 'active',
    })
    navigate('/active')
  }
}
```

**НОВЫЙ КОД** (✅):
```typescript
const handleBook = () => {
  if (store.currentRecommendation) {
    const activity = store.currentRecommendation.activity
    const newActivity: ActiveActivity = {
      id: 'active_' + Date.now(),
      name: activity.name,
      location: activity.location.name,
      duration: activity.duration,
      cost: activity.cost,
      startedAt: Date.now(),
      imageUrl: activity.imageUrl,
      status: 'active',
    }
    
    // ✅ НОВОЕ: Устанавливаем как текущую
    store.setCurrentActivity(newActivity)
    
    // Добавляем в список активных
    store.startActivity(newActivity)
    
    navigate('/active')
  }
}
```

---

## ФАЗА 6: Обновить CompletionScreen.tsx

### Шаг 6.1: Очистить состояние при завершении

**ТЕКУЩИЙ КОД** (❌):
```typescript
const handleContinue = () => {
  store.setCurrentRecommendation(null)
  navigate('/garden')
}
```

**НОВЫЙ КОД** (✅):
```typescript
const handleContinue = () => {
  // ✅ НОВОЕ: Полный сброс состояния
  store.setCurrentRecommendation(null)
  store.clearCurrentActivity()  // ← Жёсткий сброс
  navigate('/garden')
}
```

---

## ТЕСТОВЫЕ СЦЕНАРИИ

### Тест 1: Автозавершение при истечении времени
```
1. Запустить активность на 1 минуту
2. Ждать 61 секунду
3. ✅ ОЖИДАЕТСЯ: Активность автоматически завершается
4. ✅ ОЖИДАЕТСЯ: Экран показывает "Time's up!"
5. ✅ ОЖИДАЕТСЯ: currentActivity = null
```

### Тест 2: Синхронизация при навигации
```
1. Запустить активность (Mountain Hiking, 180 мин)
2. Перейти в 🗺️ Path
3. Ждать 30 секунд
4. Вернуться в 🔴 Active
5. ✅ ОЖИДАЕТСЯ: Таймер показывает ~30 сек, не сбросился
6. ✅ ОЖИДАЕТСЯ: Прогресс-бар обновлён
```

### Тест 3: Реактивность меню
```
1. Запустить активность
2. ✅ ОЖИДАЕТСЯ: Иконка 🔴 пульсирует
3. ✅ ОЖИДАЕТСЯ: Наведение показывает "Active: Mountain Hiking"
4. Завершить активность
5. ✅ ОЖИДАЕТСЯ: Иконка становится ⭕ (неактивна)
```

### Тест 4: Жёсткий сброс при завершении
```
1. Запустить активность
2. Завершить активность
3. Нажать "View Your Garden"
4. Вернуться в 🔴 Active
5. ✅ ОЖИДАЕТСЯ: Экран пуст (активность удалена)
6. ✅ ОЖИДАЕТСЯ: currentActivity = null
```

### Тест 5: Несколько активностей
```
1. Запустить Hiking (180 мин)
2. Запустить Yoga (30 мин)
3. ✅ ОЖИДАЕТСЯ: Обе видны в списке
4. Ждать 31 минуту
5. ✅ ОЖИДАЕТСЯ: Yoga завершается, Hiking продолжается
6. ✅ ОЖИДАЕТСЯ: currentActivity указывает на Hiking
```

---

## ПОРЯДОК РЕАЛИЗАЦИИ

1. **Шаг 1**: Обновить `web/src/store.ts` (Фаза 1)
2. **Шаг 2**: Обновить `web/src/App.tsx` (Фаза 4)
3. **Шаг 3**: Обновить `web/src/screens/ActiveScreen.tsx` (Фаза 2)
4. **Шаг 4**: Обновить `web/src/components/Navigation.tsx` (Фаза 3)
5. **Шаг 5**: Обновить `web/src/screens/BloomScreen.tsx` (Фаза 5)
6. **Шаг 6**: Обновить `web/src/screens/CompletionScreen.tsx` (Фаза 6)
7. **Шаг 7**: Тестирование всех сценариев

---

## ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

✅ **Реактивность**: UI обновляется в реальном времени
✅ **Автозавершение**: Активность завершается при истечении времени
✅ **Синхронизация**: Навигация не вызывает потери данных
✅ **Меню**: Иконка 🔴 показывает правильный статус
✅ **Память**: Нет утечек (интервалы дедублицированы)
✅ **Сброс**: Завершение полностью очищает состояние

