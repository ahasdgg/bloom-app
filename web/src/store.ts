import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgeGroup } from './timeline/types'

export interface Recommendation {
  id: string
  activity: {
    name: string
    description: string
    category: string
    location: {
      name: string
      latitude: number
      longitude: number
      address?: string
    }
    duration: number
    difficulty: string
    cost: string
    costAmount?: number
    indoor: boolean
    imageUrl?: string
  }
  relevanceScore: number
  reasoning: string
  contextSnapshot: {
    temperature?: number
    weather?: string
    timeOfDay?: string
    availableTime?: number
  }
  createdAt: number
  expiresAt: number
}

export interface CompletedActivity extends Recommendation {
  rating: number
  feedback: string
  recommendation: 'yes' | 'maybe' | 'no'
  pointsEarned: number
  completedAt: number
}

export interface ActiveActivity {
  id: string
  name: string
  location: string
  duration: number
  cost: string
  startedAt: number
  imageUrl?: string
  status: 'active' | 'paused' | 'completed'
  pausedAt?: number
}

// Custom user-created timeline event
export interface CustomEvent {
  id: string
  title: string
  category: string
  emoji: string
  startTs: number
  endTs: number
  note?: string
  color?: string
}

export interface AppState {
  userId: string | null
  language: 'en' | 'ru'
  userAgeGroup: AgeGroup
  privacyUnlocked: boolean
  privacyBlurEnabled: boolean
  currentRecommendation: Recommendation | null
  currentActivity: ActiveActivity | null
  completedActivities: CompletedActivity[]
  activeActivities: ActiveActivity[]
  customEvents: CustomEvent[]
  isLoading: boolean
  error: string | null

  // Custom Events
  addCustomEvent: (event: CustomEvent) => void
  updateCustomEvent: (event: CustomEvent) => void
  deleteCustomEvent: (id: string) => void

  // Activity Management
  setUserId: (userId: string) => void
  setLanguage: (language: 'en' | 'ru') => void
  setUserAgeGroup: (age: AgeGroup) => void
  setPrivacyUnlocked: (unlocked: boolean) => void
  setPrivacyBlurEnabled: (enabled: boolean) => void
  setCurrentRecommendation: (recommendation: Recommendation | null) => void
  addCompletedActivity: (activity: CompletedActivity) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void

  // Current Activity Management
  setCurrentActivity: (activity: ActiveActivity | null) => void
  clearCurrentActivity: () => void

  // Active Activity Management
  startActivity: (activity: ActiveActivity) => void
  pauseActivity: (activityId: string) => void
  resumeActivity: (activityId: string) => void
  cancelActivity: (activityId: string) => void
  completeActivity: (activityId: string) => void
  syncActiveActivities: () => void
  globalSyncActiveActivities: () => void
  checkExpiredActivities: () => void
}

const initialState = {
  userId: null,
  language: 'en' as const,
  userAgeGroup: 'adult' as AgeGroup,
  privacyUnlocked: false,
  privacyBlurEnabled: true,
  currentRecommendation: null,
  currentActivity: null,
  completedActivities: [],
  activeActivities: [],
  customEvents: [],
  isLoading: false,
  error: null,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Timeline helpers ─────────────────────────────────────
      // Auto-insert activities into user timeline (customEvents).
      // Uses stable ids so we can update/remove later.
      // Note: we keep this logic in store to work across screens.
      //
      // Event id format:
      // - activity:  auto_act_<activeActivityId>
      // - recommendation (if ever needed): auto_rec_<recommendationId>
      //
      // Only activity events are created right now (on startActivity).
      //
      // (No separate public API; screens call existing methods.)

      setUserId: (userId: string) => {
        set({ userId })
      },

      setLanguage: (language: 'en' | 'ru') => {
        set({ language })
      },

      setUserAgeGroup: (age: AgeGroup) => {
        set({ userAgeGroup: age })
      },

      setPrivacyUnlocked: (unlocked: boolean) => {
        set({ privacyUnlocked: unlocked })
      },

      setPrivacyBlurEnabled: (enabled: boolean) => {
        set({ privacyBlurEnabled: enabled })
      },

      addCustomEvent: (event: CustomEvent) => {
        set(s => ({ customEvents: [...s.customEvents, event] }))
      },

      updateCustomEvent: (event: CustomEvent) => {
        set(s => ({ customEvents: s.customEvents.map(e => e.id === event.id ? event : e) }))
      },

      deleteCustomEvent: (id: string) => {
        set(s => ({ customEvents: s.customEvents.filter(e => e.id !== id) }))
      },

      setCurrentRecommendation: (recommendation: Recommendation | null) => {
        set({ currentRecommendation: recommendation })
      },

      addCompletedActivity: (activity: CompletedActivity) => {
        const activities = get().completedActivities
        const newActivities = [activity, ...activities].slice(0, 100)
        set({ completedActivities: newActivities })
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set(initialState)
      },

      // Current Activity Methods
      setCurrentActivity: (activity: ActiveActivity | null) => {
        set({ currentActivity: activity })
      },

      clearCurrentActivity: () => {
        set({ currentActivity: null })
      },

      // Active Activity Methods
      startActivity: (activity: ActiveActivity) => {
        const current = get().activeActivities
        const newActivities = [...current, { ...activity, status: 'active' as const }]
        set({ activeActivities: newActivities })

        // Auto-add to timeline as a planned/active event
        const evId = `auto_act_${activity.id}`
        const existing = (get().customEvents ?? []).some(e => e.id === evId)
        if (!existing) {
          const startTs = activity.startedAt
          const endTs = activity.startedAt + activity.duration * 60_000
          get().addCustomEvent({
            id: evId,
            title: activity.name,
            category: 'adventure',
            emoji: '🕒',
            startTs,
            endTs,
            note: `Авто: активность (${activity.location})`,
            color: undefined,
          })
        }
      },

      pauseActivity: (activityId: string) => {
        const activities = get().activeActivities
        const updated = activities.map(a =>
          a.id === activityId
            ? { ...a, status: 'paused' as const, pausedAt: Date.now() }
            : a
        )
        set({ activeActivities: updated })
      },

      resumeActivity: (activityId: string) => {
        const activities = get().activeActivities
        const updated = activities.map(a =>
          a.id === activityId
            ? {
                ...a,
                status: 'active' as const,
                startedAt: a.startedAt + (Date.now() - (a.pausedAt || Date.now())),
                pausedAt: undefined,
              }
            : a
        )
        set({ activeActivities: updated })

        // Keep auto timeline event in sync with shifted start time
        const act = updated.find(a => a.id === activityId)
        if (act) {
          const evId = `auto_act_${activityId}`
          const ev = (get().customEvents ?? []).find(e => e.id === evId)
          if (ev) {
            const startTs = act.startedAt
            const endTs = act.startedAt + act.duration * 60_000
            get().updateCustomEvent({ ...ev, startTs, endTs })
          }
        }
      },

      cancelActivity: (activityId: string) => {
        const activities = get().activeActivities
        const updated = activities.filter(a => a.id !== activityId)
        set({ activeActivities: updated })

        // Remove auto timeline event for this activity
        const evId = `auto_act_${activityId}`
        const has = (get().customEvents ?? []).some(e => e.id === evId)
        if (has) get().deleteCustomEvent(evId)
      },

      completeActivity: (activityId: string) => {
        const activities = get().activeActivities
        const updated = activities.map(a =>
          a.id === activityId ? { ...a, status: 'completed' as const } : a
        )
        set({ activeActivities: updated })

        // Once completed, we rely on `completedActivities` for history.
        // Remove the auto timeline placeholder to avoid duplicates.
        const evId = `auto_act_${activityId}`
        const has = (get().customEvents ?? []).some(e => e.id === evId)
        if (has) get().deleteCustomEvent(evId)
      },

      syncActiveActivities: () => {
        // Force re-sync when navigating back to menu
        const activities = get().activeActivities
        set({ activeActivities: [...activities] })
      },

      globalSyncActiveActivities: () => {
        // Global sync when navigating between screens
        const activities = get().activeActivities
        set({ activeActivities: [...activities] })
      },

      checkExpiredActivities: () => {
        const activities = get().activeActivities
        const currentActivity = get().currentActivity
        const now = Date.now()

        const updated = activities.map(activity => {
          if (activity.status !== 'active') return activity

          const elapsedMs = now - activity.startedAt
          const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60)

          // Auto-complete if time exceeded
          if (elapsedMinutes >= activity.duration) {
            // If this is the current activity, clear it
            if (currentActivity?.id === activity.id) {
              get().clearCurrentActivity()
            }
            return { ...activity, status: 'completed' as const }
          }

          return activity
        })

        set({ activeActivities: updated })
      },
    }),
    {
      name: 'breath-of-fresh-air-store',
    }
  )
)
