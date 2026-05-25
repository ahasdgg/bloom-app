// ═══════════════════════════════════════════════════════════════
//  TimeBloom — Timeline Types
// ═══════════════════════════════════════════════════════════════

export type BoldnessLevel = 1 | 2 | 3 | 4

export type EventType = 'static' | 'ai_offer'

export type CostType = 'external' | 'solo'   // external = нужны деньги/такси, solo = только время

export type AgeGroup = 'young' | 'adult' | 'senior'

// ── Static event (from calendar / completed activity) ──────────
export interface StaticEvent {
  kind: 'static'
  id: string
  title: string
  category: string
  startTs: number   // unix ms
  endTs: number     // unix ms
  color?: string
}

// ── AI-generated offer (fills gaps) ───────────────────────────
export interface AIEvent {
  kind: 'ai'
  id: string
  title: string
  emoji: string
  category: string
  boldnessRequired: BoldnessLevel   // minimum boldness to show
  costType: CostType
  minAgeGroup: AgeGroup             // 'young' | 'adult' | 'senior' — all ages above this see it
  allowedHours: [number, number]    // [startHour, endHour] e.g. [8, 22]
  durationMin: number               // suggested duration in minutes
  startTs: number                   // filled by generateSmartGaps
  endTs: number
  color: string
  description: string
}

export type TimelineEvent = StaticEvent | AIEvent

// ── User profile (for context matching) ───────────────────────
export interface UserProfile {
  ageGroup: AgeGroup
}
