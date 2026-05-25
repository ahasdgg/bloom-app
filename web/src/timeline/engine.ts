// ═══════════════════════════════════════════════════════════════
//  TimeBloom — Boldness Engine + Context Matching + Smart Gaps
// ═══════════════════════════════════════════════════════════════
import type {
  BoldnessLevel,
  StaticEvent,
  AIEvent,
  TimelineEvent,
  UserProfile,
  AgeGroup,
} from './types'
import { OFFER_CATALOG } from './offerCatalog'

// ── Age group ordering ─────────────────────────────────────────
const AGE_ORDER: Record<AgeGroup, number> = { young: 0, adult: 1, senior: 2 }

function ageAllowed(userAge: AgeGroup, minAge: AgeGroup): boolean {
  // senior can see senior-only; adult can see adult+young; young can see young only
  return AGE_ORDER[userAge] >= AGE_ORDER[minAge]
}

// ── Hour-range check (supports overnight ranges like 22–6) ─────
function hourInRange(hour: number, range: [number, number]): boolean {
  const [s, e] = range
  if (s <= e) return hour >= s && hour < e
  // overnight: e.g. [22, 6] → 22..24 or 0..6
  return hour >= s || hour < e
}

// ── Context filter: replace intense activities for seniors ─────
function applyAgeContext(
  template: (typeof OFFER_CATALOG)[0],
  profile: UserProfile
): (typeof OFFER_CATALOG)[0] {
  if (profile.ageGroup !== 'senior') return template
  // replace high-intensity fitness with gentle alternatives
  if (template.category === 'fitness' && template.boldnessRequired <= 2) {
    return {
      ...template,
      title: 'Скандинавская ходьба',
      emoji: '🚶',
      description: 'Мягкая нагрузка — идеально для суставов',
      durationMin: 40,
    }
  }
  return template
}

// ── Main filter: boldness + context ───────────────────────────
export function filterOffers(
  boldness: BoldnessLevel,
  profile: UserProfile,
  nowHour: number
): (typeof OFFER_CATALOG)[0][] {
  return OFFER_CATALOG.filter(o => {
    if (o.boldnessRequired > boldness) return false
    if (!ageAllowed(profile.ageGroup, o.minAgeGroup)) return false
    if (!hourInRange(nowHour, o.allowedHours)) return false
    return true
  }).map(o => applyAgeContext(o, profile))
}

// ── generateSmartGaps ──────────────────────────────────────────
// Finds free windows in the schedule and inserts AI offers.
// Returns a merged, sorted array of StaticEvent + AIEvent.
export function generateSmartGaps(
  staticEvents: StaticEvent[],
  boldness: BoldnessLevel,
  profile: UserProfile,
  minGapMinutes = 30
): TimelineEvent[] {
  if (staticEvents.length === 0) return []

  const sorted = [...staticEvents].sort((a, b) => a.startTs - b.startTs)
  const result: TimelineEvent[] = [...sorted]

  let idCounter = 0

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStartTs = sorted[i].endTs
    const gapEndTs   = sorted[i + 1].startTs
    const gapMin     = (gapEndTs - gapStartTs) / 60_000

    if (gapMin < minGapMinutes) continue

    const gapHour = new Date(gapStartTs).getHours()
    const available = filterOffers(boldness, profile, gapHour)
    if (available.length === 0) continue

    // pick deterministically (hash of gap position)
    const pick = available[(i * 7 + 3) % available.length]
    const durMs = Math.min(pick.durationMin * 60_000, gapEndTs - gapStartTs - 5 * 60_000)
    if (durMs < 10 * 60_000) continue

    const offer: AIEvent = {
      kind: 'ai',
      id: `ai_gap_${idCounter++}`,
      title: pick.title,
      emoji: pick.emoji,
      category: pick.category,
      boldnessRequired: pick.boldnessRequired,
      costType: pick.costType,
      minAgeGroup: pick.minAgeGroup,
      allowedHours: pick.allowedHours,
      durationMin: pick.durationMin,
      startTs: gapStartTs + 5 * 60_000,   // 5-min buffer
      endTs:   gapStartTs + 5 * 60_000 + durMs,
      color: pick.color,
      description: pick.description,
    }
    result.push(offer)
  }

  return result.sort((a, b) => a.startTs - b.startTs)
}

// ── Overlap detection ──────────────────────────────────────────
export function detectOverlaps(events: TimelineEvent[]): Map<string, string[]> {
  const overlaps = new Map<string, string[]>()
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j]
      if (a.startTs < b.endTs && b.startTs < a.endTs) {
        overlaps.set(a.id, [...(overlaps.get(a.id) ?? []), b.id])
        overlaps.set(b.id, [...(overlaps.get(b.id) ?? []), a.id])
      }
    }
  }
  return overlaps
}

// ── Horizontal offset per category ────────────────────────────
const CATEGORY_X_OFFSET: Record<string, number> = {
  work: -28, study: -22, fitness: -18,
  hiking: 20, cycling: 22, yoga: 16,
  arts: 8, culture: 10, food: 4,
  social: 14, relaxation: 18, adventure: 24,
  nature: 20, family: -8, nightlife: 12,
  adult: 6, '18+': 6, intimate: 0,
  default: 0,
}

export function getCategoryXOffset(category: string, jitter: number): number {
  const base = CATEGORY_X_OFFSET[category] ?? CATEGORY_X_OFFSET.default
  return base + ((jitter % 7) - 3) * 1.5
}

// ── Boldness theme ─────────────────────────────────────────────
export interface BoldnessTheme {
  label: string
  labelRu: string
  emoji: string
  accent: string
  bg: string
}

export const BOLDNESS_THEMES: Record<BoldnessLevel, BoldnessTheme> = {
  1: { label: 'Comfort',      labelRu: 'Уют',          emoji: '🏡', accent: '#66bb6a', bg: '#f1f8e9' },
  2: { label: 'Standard',     labelRu: 'Стандарт',     emoji: '🌆', accent: '#42a5f5', bg: '#e3f2fd' },
  3: { label: 'Experiment',   labelRu: 'Эксперимент',  emoji: '🎲', accent: '#ffa726', bg: '#fff3e0' },
  4: { label: 'No Limits',    labelRu: 'Без границ',   emoji: '🔥', accent: '#ef5350', bg: '#fce4ec' },
}
