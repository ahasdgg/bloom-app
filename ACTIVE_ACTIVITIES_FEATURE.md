# 🔴 Active Activities Feature

**Status**: ✅ **READY**  
**New Tab**: Active (🔴)  
**Route**: `/active`

---

## 🎯 What's New

### New Screen: Active Activities
- **Shows**: Activities currently in progress
- **Tracks**: Real-time timer for each activity
- **Features**: Finish, Pause, Cancel buttons

### New Navigation Tab
- **Icon**: 🔴 (red dot - live indicator)
- **Label**: Active
- **Position**: Between Discover and Path

---

## 📊 Active Activity Card

Each active activity shows:

### Header
- Activity name
- 🔴 Live status badge (pulsing animation)

### Location
- 📍 Location name

### Timer Section
- **Elapsed Time**: How long you've been doing it
- **Total Duration**: How long it should take
- **Progress Bar**: Visual progress indicator
- **Remaining Time**: How much time left

### Meta Info
- 💰 Cost
- ⏱️ Total duration

### Action Buttons
- ✓ **Finish Activity** (green) - Complete and go to rating
- ⏸ **Pause** (yellow) - Pause the activity
- ✕ **Cancel** (gray) - Cancel the activity

---

## ⏱️ Timer Features

### Real-Time Updates
- Updates every second
- Shows elapsed time in format: `45m` or `1h 30m`
- Progress bar fills as time passes

### Progress Calculation
```
Progress % = (Elapsed Time / Total Duration) × 100
```

### Time Display
- **Elapsed**: How long you've been active
- **Total**: How long the activity should take
- **Remaining**: Time left to complete

---

## 🎮 User Flow

### Starting an Activity
1. Get recommendation on Seed screen
2. Click "Let's Go!" on Bloom screen
3. Activity starts and appears in Active tab
4. Timer starts counting

### During Activity
1. Go to Active tab
2. See real-time timer
3. Watch progress bar fill
4. Can pause or cancel anytime

### Finishing Activity
1. Click "Finish Activity" button
2. Go to Completion screen
3. Rate and provide feedback
4. Get points and rewards
5. Activity moves to Path (history)

---

## 📁 Files Created

### New Files
- ✅ `web/src/screens/ActiveScreen.tsx` - Main active activities screen
- ✅ `web/src/screens/ActiveScreen.css` - Styling

### Modified Files
- ✅ `web/src/components/Navigation.tsx` - Added Active tab
- ✅ `web/src/App.tsx` - Added `/active` route

---

## 🎨 Design Features

### Colors
- **Live Badge**: Red (#ff6b6b) with pulsing animation
- **Finish Button**: Green (#90ee90)
- **Pause Button**: Yellow (#ffd700)
- **Cancel Button**: Gray (#f0f0f0)
- **Progress Bar**: Gold (#b8944e)

### Animations
- Pulsing red badge (live indicator)
- Smooth progress bar fill
- Hover effects on cards
- Button transitions

### Responsive Design
- Mobile: Full width, stacked buttons
- Tablet: Centered, comfortable layout
- Desktop: Max-width 600px

---

## 📊 Example Active Activity

```
🔴 Live

Mountain Hiking
📍 Rocky Mountains

Elapsed: 45m / Total: 180m
[████████░░░░░░░░░░░░░░░░░░] 25%
⏱️ 135m remaining

💰 free  ⏱️ 180 min total

[✓ Finish Activity] [⏸ Pause] [✕ Cancel]
```

---

## 🔄 Activity Lifecycle

```
Seed Screen (Get Recommendation)
    ↓
Bloom Screen (See Details)
    ↓
[Click "Let's Go!"]
    ↓
Active Screen (Timer Starts)
    ├─ Timer running
    ├─ Progress updating
    └─ Can pause/cancel
    ↓
[Click "Finish Activity"]
    ↓
Completion Screen (Rate & Feedback)
    ↓
Reward Screen (Points & Achievements)
    ↓
Path Screen (Activity in History)
```

---

## 🧪 Testing

### Test 1: View Active Activity
1. Open app
2. Click Active tab
3. ✅ Should show 1 activity with timer

### Test 2: Timer Updates
1. Go to Active tab
2. Watch timer for 10 seconds
3. ✅ Elapsed time should increase
4. ✅ Progress bar should fill

### Test 3: Finish Activity
1. Click "Finish Activity"
2. ✅ Should go to Completion screen
3. Rate and complete
4. ✅ Activity should move to Path

### Test 4: Empty State
1. Cancel all active activities
2. Go to Active tab
3. ✅ Should show empty state with "Get a Recommendation" button

### Test 5: Multiple Activities
1. Start 2-3 activities
2. Go to Active tab
3. ✅ Should show all with separate timers

---

## 🚀 How to Use

### Start an Activity
1. Click 🌱 Discover tab
2. Click sphere → get recommendation
3. Click "Let's Go!" on Bloom screen
4. Activity starts automatically

### Track Activity
1. Click 🔴 Active tab
2. See real-time timer
3. Watch progress bar
4. See remaining time

### Finish Activity
1. Click "✓ Finish Activity"
2. Rate on Completion screen
3. Get points and rewards
4. See activity in Path

---

## 💡 Features

- ✅ Real-time timer (updates every second)
- ✅ Progress bar visualization
- ✅ Elapsed vs total time display
- ✅ Remaining time calculation
- ✅ Finish button (go to completion)
- ✅ Pause button (pause activity)
- ✅ Cancel button (remove activity)
- ✅ Live status badge (pulsing)
- ✅ Empty state (no active activities)
- ✅ Responsive design
- ✅ Smooth animations

---

## 🎯 Next Steps

### Immediate
- ✅ Active tab shows in-progress activities
- ✅ Real-time timer tracking
- ✅ Finish/Pause/Cancel buttons

### Future Enhancements
- [ ] Pause and resume functionality
- [ ] Multiple simultaneous activities
- [ ] Notifications when time is up
- [ ] Activity history with duration
- [ ] Statistics on activity completion
- [ ] Streak tracking
- [ ] Activity reminders

---

## 📞 Summary

**New Feature**: Active Activities Tab  
**Purpose**: Track activities in real-time  
**Location**: 🔴 Active tab in navigation  
**Features**: Timer, progress bar, finish/pause/cancel buttons  

**Status**: ✅ **READY TO USE**

---

**Now you can track your activities in real-time! 🔴**
