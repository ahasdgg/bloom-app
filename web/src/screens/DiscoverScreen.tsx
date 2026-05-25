import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { OFFER_CATALOG } from '../timeline/offerCatalog'
import './DiscoverScreen.css'

// ─── Types ────────────────────────────────────────────────────
interface DiscoverOffer {
  id: string
  title: string
  emoji: string
  category: string
  catLabel: string
  costType: 'solo' | 'external'
  duration: number
  description: string
  image: string
  rating: number | null
  price: string
  priceNum: number
  isNew: boolean
  discount: number | null
}

// ─── Static data ──────────────────────────────────────────────
const CAT_LABEL: Record<string, string> = {
  nature: 'Природа', relaxation: 'Отдых', fitness: 'Спорт',
  family: 'Семья', culture: 'Культура', food: 'Еда',
  social: 'Социальное', nightlife: 'Ночная жизнь',
  adult: 'Для взрослых', '18+': '18+', intimate: 'Личное',
}

const CAT_IMG: Record<string, string[]> = {
  nature: [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=280&fit=crop&q=80',
  ],
  relaxation: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=280&fit=crop&q=80',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=280&fit=crop&q=80',
  ],
  family: [
    'https://images.unsplash.com/photo-1511895426328-dc8714191011?w=400&h=280&fit=crop&q=80',
  ],
  culture: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=280&fit=crop&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561404?w=400&h=280&fit=crop&q=80',
  ],
  social: [
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=280&fit=crop&q=80',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=280&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=280&fit=crop&q=80',
  ],
  adult: [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=280&fit=crop&q=80',
  ],
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function getImg(cat: string, seed: number): string {
  const arr = CAT_IMG[cat] ?? CAT_IMG.nature
  return arr[seed % arr.length]
}

const ALL_OFFERS: DiscoverOffer[] = OFFER_CATALOG.map((o, i) => {
  const s = hash(o.title + i)
  const priceNum = o.costType === 'solo' ? 0 : 300 + (s % 18) * 150
  return {
    id: `o${i}`,
    title: o.title,
    emoji: o.emoji,
    category: o.category,
    catLabel: CAT_LABEL[o.category] ?? o.category,
    costType: o.costType,
    duration: o.durationMin,
    description: o.description,
    image: getImg(o.category, s),
    rating: s % 4 === 0 ? null : Math.round((65 + s % 35)) / 10,
    price: priceNum === 0 ? 'Бесплатно' : `От ${priceNum} ₽`,
    priceNum,
    isNew: s % 7 === 0,
    discount: s % 5 === 0 ? 10 + (s % 4) * 10 : null,
  }
})

const HERO_SLIDES = [
  {
    title: 'Пикник Афиши 2026',
    sub: '20 июня в 14:00, Музей-заповедник «Коломенское»',
    badge: 'КОНЦЕРТ',
    price: 'От 1000 ₽',
    discount: '-50%',
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&h=420&fit=crop&q=80',
    color: '#1a1a2e',
  },
  {
    title: 'Йога на рассвете',
    sub: 'Каждое утро в Парке Горького',
    badge: 'ЗДОРОВЬЕ',
    price: 'Бесплатно',
    discount: null,
    img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&h=420&fit=crop&q=80',
    color: '#1b2838',
  },
  {
    title: 'Ночной квиз',
    sub: 'Каждую пятницу, лучшие бары города',
    badge: 'ВЕЧЕРИНКА',
    price: 'От 800 ₽',
    discount: null,
    img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&h=420&fit=crop&q=80',
    color: '#0d1117',
  },
]

const NAV_CATS = [
  { id: 'all',       label: 'Все' },
  { id: 'culture',   label: 'Культура' },
  { id: 'fitness',   label: 'Спорт' },
  { id: 'food',      label: 'Еда' },
  { id: 'social',    label: 'Социальное' },
  { id: 'relaxation',label: 'Отдых' },
  { id: 'nature',    label: 'Природа' },
  { id: 'nightlife', label: 'Ночная жизнь' },
]

const SECTIONS = [
  { id: 'rec',     title: 'Рекомендации для вас', fn: (_o: DiscoverOffer) => true },
  { id: 'free',    title: 'Бесплатно',             fn: (o: DiscoverOffer) => o.costType === 'solo' },
  { id: 'culture', title: 'Культура',              fn: (o: DiscoverOffer) => o.category === 'culture' },
  { id: 'sport',   title: 'Спорт и здоровье',      fn: (o: DiscoverOffer) => ['fitness', 'nature'].includes(o.category) },
  { id: 'social',  title: 'Социальное',            fn: (o: DiscoverOffer) => o.category === 'social' },
  { id: 'food',    title: 'Еда и кофе',            fn: (o: DiscoverOffer) => o.category === 'food' },
  { id: 'evening', title: 'Вечерняя программа',    fn: (_o: DiscoverOffer) => true },
]

// ─── Card ─────────────────────────────────────────────────────
const Card: React.FC<{
  o: DiscoverOffer
  liked: boolean
  onLike: () => void
  onClick: () => void
}> = ({ o, liked, onLike, onClick }) => (
  <div className="dc-card" onClick={onClick}>
    <div className="dc-card__img-box">
      <img
        src={o.image}
        alt={o.title}
        className="dc-card__img"
        loading="lazy"
        onError={e => {
          (e.target as HTMLImageElement).src =
            `https://placehold.co/400x280/b8944e/fff?text=${encodeURIComponent(o.emoji)}`
        }}
      />
      {o.rating !== null && <span className="dc-card__rating">{o.rating.toFixed(1)}</span>}
      {o.discount && <span className="dc-card__discount">-{o.discount}%</span>}
      {o.isNew && <span className="dc-card__new">NEW</span>}
      <button
        className={`dc-card__heart ${liked ? 'liked' : ''}`}
        onClick={e => { e.stopPropagation(); onLike() }}
      >
        {liked ? '♥' : '♡'}
      </button>
    </div>
    <div className="dc-card__body">
      <p className="dc-card__cat">{o.catLabel}</p>
      <p className="dc-card__title">{o.title}</p>
      <p className="dc-card__desc">{o.description}</p>
      <div className="dc-card__foot">
        <span className="dc-card__price">{o.price}</span>
        <span className="dc-card__dur">{o.duration} мин</span>
      </div>
    </div>
  </div>
)

// ─── Carousel row ─────────────────────────────────────────────
const Row: React.FC<{
  title: string
  items: DiscoverOffer[]
  liked: Set<string>
  onLike: (id: string) => void
  onOpen: (o: DiscoverOffer) => void
}> = ({ title, items, liked, onLike, onOpen }) => {
  const ref = useRef<HTMLDivElement>(null)
  if (!items.length) return null
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 260, behavior: 'smooth' })
  return (
    <section className="dc-row">
      <div className="dc-row__head">
        <h2 className="dc-row__title">{title}</h2>
        <div className="dc-row__nav">
          <button className="dc-row__arr" onClick={() => scroll(-1)}>‹</button>
          <button className="dc-row__arr" onClick={() => scroll(1)}>›</button>
        </div>
      </div>
      <div className="dc-row__track" ref={ref}>
        {items.map(o => (
          <Card key={o.id} o={o} liked={liked.has(o.id)} onLike={() => onLike(o.id)} onClick={() => onOpen(o)} />
        ))}
      </div>
    </section>
  )
}

// ─── Modal ────────────────────────────────────────────────────
const Modal: React.FC<{
  o: DiscoverOffer
  liked: boolean
  onLike: () => void
  onClose: () => void
  onStart: () => void
}> = ({ o, liked, onLike, onClose, onStart }) => (
  <div className="dc-modal-bg" onClick={onClose}>
    <div className="dc-modal" onClick={e => e.stopPropagation()}>
      <button className="dc-modal__close" onClick={onClose}>✕</button>
      <div className="dc-modal__img-box">
        <img
          src={o.image}
          alt={o.title}
          className="dc-modal__img"
          onError={e => {
            (e.target as HTMLImageElement).src =
              `https://placehold.co/600x300/b8944e/fff?text=${encodeURIComponent(o.emoji)}`
          }}
        />
        <div className="dc-modal__img-overlay" />
        <div className="dc-modal__img-info">
          <span className="dc-modal__badge">{o.catLabel}</span>
          <h2 className="dc-modal__title">{o.emoji} {o.title}</h2>
        </div>
      </div>
      <div className="dc-modal__body">
        <p className="dc-modal__desc">{o.description}</p>
        <div className="dc-modal__meta">
          <div className="dc-modal__meta-item">
            <span className="dc-modal__meta-k">Длительность</span>
            <span className="dc-modal__meta-v">{o.duration} мин</span>
          </div>
          <div className="dc-modal__meta-item">
            <span className="dc-modal__meta-k">Стоимость</span>
            <span className="dc-modal__meta-v">{o.price}</span>
          </div>
          <div className="dc-modal__meta-item">
            <span className="dc-modal__meta-k">Формат</span>
            <span className="dc-modal__meta-v">{o.costType === 'solo' ? '🕐 Дома' : '🚶 Выход'}</span>
          </div>
          {o.rating && (
            <div className="dc-modal__meta-item">
              <span className="dc-modal__meta-k">Рейтинг</span>
              <span className="dc-modal__meta-v">⭐ {o.rating}</span>
            </div>
          )}
        </div>
        <div className="dc-modal__actions">
          <button className="dc-modal__btn dc-modal__btn--go" onClick={onStart}>
            🚀 Начать сейчас
          </button>
          <button
            className={`dc-modal__btn dc-modal__btn--save ${liked ? 'liked' : ''}`}
            onClick={onLike}
          >
            {liked ? '♥ Сохранено' : '♡ Сохранить'}
          </button>
        </div>
      </div>
    </div>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────
const DiscoverScreen: React.FC = () => {
  const store    = useAppStore()
  const navigate = useNavigate()

  const [liked, setLiked]       = useState<Set<string>>(new Set())
  const [modal, setModal]       = useState<DiscoverOffer | null>(null)
  const [heroIdx, setHeroIdx]   = useState(0)
  const [catFilter, setCat]     = useState('all')
  const heroRef                 = useRef<ReturnType<typeof setInterval> | null>(null)

  // auto-advance hero
  useEffect(() => {
    heroRef.current = setInterval(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), 5000)
    return () => { if (heroRef.current) clearInterval(heroRef.current) }
  }, [])

  const visible = useMemo(() => ALL_OFFERS, [])

  const filtered = useMemo(() => {
    if (catFilter === 'all') return visible
    return visible.filter(o => o.category === catFilter)
  }, [visible, catFilter])

  const toggleLike = (id: string) =>
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const startOffer = (o: DiscoverOffer) => {
    store.setCurrentRecommendation({
      id: 'disc_' + Date.now(),
      activity: {
        name: o.title,
        description: o.description,
        category: o.category,
        location: { name: 'Ваш город', latitude: 55.75, longitude: 37.62 },
        duration: o.duration,
        difficulty: 'medium',
        cost: o.price,
        costAmount: o.priceNum || undefined,
        indoor: o.costType === 'solo',
        imageUrl: o.image,
      },
      relevanceScore: 0.9,
      reasoning: o.description,
      contextSnapshot: {},
      createdAt: Date.now(),
      expiresAt: Date.now() + 3_600_000,
    })
    setModal(null)
    navigate('/bloom')
  }

  const hero = HERO_SLIDES[heroIdx]
  return (
    <div className="dc">

      {/* ══ TOP NAV BAR ══════════════════════════════════════ */}
      <div className="dc-topbar">
        <div className="dc-topbar__logo">
          <span className="dc-topbar__logo-icon">🌿</span>
          <span className="dc-topbar__logo-text">афиша</span>
        </div>
        <div className="dc-topbar__cats">
          {NAV_CATS.map(c => (
            <button
              key={c.id}
              className={`dc-topbar__cat ${catFilter === c.id ? 'active' : ''}`}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ HERO SLIDER ══════════════════════════════════════ */}
      <div className="dc-hero" style={{ background: hero.color }}>
        <img
          key={heroIdx}
          src={hero.img}
          alt={hero.title}
          className="dc-hero__img"
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
        />
        <div className="dc-hero__grad" />
        <div className="dc-hero__content">
          <span className="dc-hero__badge">{hero.badge}</span>
          <h1 className="dc-hero__title">{hero.title}</h1>
          <p className="dc-hero__sub">{hero.sub}</p>
          <div className="dc-hero__row">
            {hero.discount && <span className="dc-hero__disc">{hero.discount}</span>}
            <span className="dc-hero__price">{hero.price}</span>
            <button
              className="dc-hero__btn"
              onClick={() => {
                const o = visible[heroIdx % Math.max(visible.length, 1)]
                if (o) startOffer(o)
              }}
            >
              Выбрать событие
            </button>
          </div>
        </div>
        <div className="dc-hero__dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`dc-hero__dot ${i === heroIdx ? 'on' : ''}`}
              onClick={() => { setHeroIdx(i); if (heroRef.current) clearInterval(heroRef.current) }}
            />
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════ */}
      {catFilter === 'all' ? (
        <>
          {SECTIONS.map(sec => (
            <Row
              key={sec.id}
              title={sec.title}
              items={visible.filter(sec.fn)}
              liked={liked}
              onLike={toggleLike}
              onOpen={setModal}
            />
          ))}
          {liked.size > 0 && (
            <Row
              title="❤️ Сохранённое"
              items={ALL_OFFERS.filter(o => liked.has(o.id))}
              liked={liked}
              onLike={toggleLike}
              onOpen={setModal}
            />
          )}
        </>
      ) : (
        <div className="dc-grid">
          {filtered.length === 0 ? (
            <div className="dc-empty">Нет предложений в этой категории</div>
          ) : (
            filtered.map(o => (
              <Card key={o.id} o={o} liked={liked.has(o.id)} onLike={() => toggleLike(o.id)} onClick={() => setModal(o)} />
            ))
          )}
        </div>
      )}

      {/* ══ MODAL ════════════════════════════════════════════ */}
      {modal && (
        <Modal
          o={modal}
          liked={liked.has(modal.id)}
          onLike={() => toggleLike(modal.id)}
          onClose={() => setModal(null)}
          onStart={() => startOffer(modal)}
        />
      )}

    </div>
  )
}

export default DiscoverScreen
