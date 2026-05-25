# Breath of Fresh Air - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Run Web Version (Easiest)

```bash
# Navigate to web directory
cd web

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser. You'll see:
- 🌱 **Seed Screen** - Click the animated sphere to get a recommendation
- 🌸 **Bloom Screen** - View the recommended activity
- 📅 **Path Screen** - See your activity history
- 🌿 **Garden Screen** - View your digital garden
- ⚙️ **Settings Screen** - Manage preferences

### Option 2: Run Mobile App (React Native)

**Prerequisites:**
- Android Studio with emulator running, OR
- Physical Android/iOS device connected

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on Android
npm run android

# OR run on iOS
npm run ios
```

---

## 📋 What's Included

### Mobile App (React Native)
- ✅ 5 fully functional screens
- ✅ 6 core services (location, weather, calendar, preferences, context, LLM)
- ✅ Zustand state management
- ✅ Offline-first architecture
- ✅ 45+ unit tests
- ✅ Gamification system

### Web App (React + Vite)
- ✅ 5 responsive screens
- ✅ Same UI/UX as mobile
- ✅ Production build (280KB gzipped)
- ✅ Mobile-first design
- ✅ Smooth animations

---

## 🎮 Features to Try

### 1. Get a Recommendation
1. Go to **Seed Screen** (home tab)
2. Click the animated sphere
3. Wait for recommendation to load
4. See the activity suggestion on **Bloom Screen**

### 2. Explore Your Garden
1. Go to **Garden Screen**
2. See your digital garden grow as you complete activities
3. Unlock new plants with achievements

### 3. View Your History
1. Go to **Path Screen**
2. See timeline of past activities
3. Filter by date or activity type

### 4. Customize Settings
1. Go to **Settings Screen**
2. Select favorite activity types
3. Set budget and distance preferences
4. Manage privacy settings

---

## 🔧 Configuration

### Add API Keys (Optional)

Create `.env` file in project root:

```env
LLM_API_KEY=your_gemini_or_gpt4_key
MAPS_API_KEY=your_maps_api_key
WEATHER_API_KEY=your_openweathermap_key
BOOKING_API_KEY=your_booking_service_key
```

Without API keys, the app uses mock data for testing.

---

## 📁 Project Structure

```
.
├── src/                    # Mobile app (React Native)
│   ├── screens/           # 5 main screens
│   ├── services/          # 6 core services
│   ├── components/        # UI components
│   ├── state/             # Zustand store
│   └── types/             # TypeScript definitions
├── web/                   # Web app (React + Vite)
│   ├── src/
│   │   ├── screens/       # 5 responsive screens
│   │   ├── components/    # Navigation & Sphere
│   │   └── store.ts       # Zustand store
│   └── vite.config.ts
├── .env.example           # Environment template
├── PROJECT_STATUS.md      # Detailed status report
└── QUICKSTART.md          # This file
```

---

## 🧪 Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/services/location.test.ts

# Run with coverage
npm test -- --coverage
```

**Current Status:**
- ✅ 45 tests passing
- ✅ Location service: 23 tests
- ✅ Weather service: 22 tests

---

## 🐛 Troubleshooting

### Web App Issues

**Blank page?**
- Check browser console (F12)
- Ensure you're on http://localhost:5173
- Try clearing browser cache

**Port 5173 already in use?**
```bash
# Kill process on port 5173
# Windows: netstat -ano | findstr :5173
# Mac/Linux: lsof -i :5173
```

### Mobile App Issues

**Android emulator not starting?**
- Open Android Studio
- Go to AVD Manager
- Create or start an emulator

**Metro bundler errors?**
```bash
# Clear cache and restart
npm start -- --reset-cache
```

**Permission denied?**
- Grant location and calendar permissions when prompted
- Check Settings > Apps > Breath of Fresh Air > Permissions

---

## 📊 Performance

### Web App Build Size
- HTML: 1.00 kB (gzip: 0.56 kB)
- CSS: 11.80 kB (gzip: 2.65 kB)
- JS: 279.95 kB (gzip: 91.48 kB)
- **Total: ~94 kB gzipped**

### Mobile App
- 943 npm packages
- Offline-first with SQLite caching
- Smooth 60fps animations

---

## 🎨 Design System

### Colors
- **Soft Sage**: #a8b8a0
- **Muted Lavender**: #c8b8d8
- **Warm Sand**: #d8c8a8

### Typography
- **Headings**: Large, rounded fonts
- **Body**: Clear, readable text
- **All text**: Accessible contrast ratios

### Animations
- Breathing sphere (smooth pulsing)
- Screen transitions (fade)
- Button interactions (haptic on mobile)
- Garden growth (smooth scaling)

---

## 📚 Documentation

- **PROJECT_STATUS.md** - Detailed project status and statistics
- **PROJECT_STRUCTURE.md** - Architecture and data models
- **.kiro/specs/breath-of-fresh-air-app/** - Full specification
  - `requirements.md` - Feature requirements
  - `design.md` - Technical design
  - `tasks.md` - Implementation tasks

---

## 🚀 Next Steps

### For Testing
1. Run web version: `cd web && npm run dev`
2. Test all screens and interactions
3. Try different activity categories
4. Check responsive design on mobile

### For Production
1. Add real API keys to `.env`
2. Test on physical devices
3. Run full test suite
4. Deploy web version to hosting
5. Submit mobile app to stores

### For Development
1. Read `PROJECT_STRUCTURE.md` for architecture
2. Check `.kiro/specs/` for detailed requirements
3. Review service implementations in `src/services/`
4. Explore screen components in `src/screens/`

---

## 💡 Tips

- **Mock Data**: Web version uses mock recommendations for testing
- **Offline Mode**: All features work without internet
- **Responsive**: Web version works on mobile, tablet, desktop
- **Type Safe**: Full TypeScript with strict mode
- **Tested**: 45+ unit tests included

---

## 📞 Support

For detailed information, see:
- **PROJECT_STATUS.md** - Complete status report
- **PROJECT_STRUCTURE.md** - Architecture details
- **.kiro/specs/** - Full specification

---

**Happy exploring! 🌿**
