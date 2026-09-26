import type { Cell } from '../view/camera'

export type Locale = 'en' | 'ar'

const english = {
  brand: 'WASL / STARTUP CIRCUIT',
  title: 'Build a company that comes alive.',
  description: 'Turn one customer opportunity into a connected network of teams, deliveries, and referrals.',
  status: 'Playable interaction prototype',
  runway: 'Runway',
  market: 'Market time',
  impact: 'Impact',
  hud: 'Game status preview',
  board: 'Startup board preview',
  teams: 'Teams',
  product: 'Product',
  growth: 'Growth',
  operations: 'Operations',
  upgrades: 'Upgrade tree',
  previewOnly: 'Growth, Operations, and upgrades arrive in later milestones.',
  switchLanguage: 'Switch to Arabic',
  boardError: 'The board could not start in this browser.',
  hoverHint: 'Move the mouse over the grid',
  zoom: 'Zoom',
  cell: 'Cell',
} as const

type MessageKey = keyof typeof english

const arabic: Record<MessageKey, string> = {
  brand: 'وصل / شبكة الشركة',
  title: 'ابنِ شركة تنبض بالحياة.',
  description: 'حوّل فرصة عميل واحدة إلى شبكة مترابطة من الفرق التي تنفّذ الطلبات وتولّد الإحالات.',
  status: 'نموذج تفاعلي قابل للتجربة',
  runway: 'المدة التشغيلية',
  market: 'وقت السوق',
  impact: 'الأثر',
  hud: 'معاينة حالة اللعبة',
  board: 'معاينة لوحة الشركة',
  teams: 'الفرق',
  product: 'المنتج',
  growth: 'النمو',
  operations: 'العمليات',
  upgrades: 'شجرة الترقيات',
  previewOnly: 'يصل النمو والعمليات والترقيات في مراحل لاحقة.',
  switchLanguage: 'التبديل إلى الإنجليزية',
  boardError: 'تعذّر تشغيل اللوحة في هذا المتصفح.',
  hoverHint: 'حرّك المؤشر فوق الشبكة',
  zoom: 'التكبير',
  cell: 'الخلية',
}

const messages: Record<Locale, Record<MessageKey, string>> = { en: english, ar: arabic }
const STORAGE_KEY = 'wasl.language'

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key]
}

export function chooseLocale(saved: string | null, browserLanguage: string): Locale {
  if (saved === 'en' || saved === 'ar') return saved
  return browserLanguage.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function readLocale(): Locale {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    // The app still works when storage is unavailable.
  }
  return chooseLocale(saved, navigator.language)
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Storage is optional until the versioned save system is built.
  }
}

export function formatBoardReadout(locale: Locale, cell: Cell | null, zoom: number): string {
  const format = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US')
  const zoomText = `${translate(locale, 'zoom')} ${format.format(Math.round(zoom * 100))}%`
  if (!cell) return `${translate(locale, 'hoverHint')} · ${zoomText}`
  return `${translate(locale, 'cell')} ${format.format(cell.column + 1)}, ${format.format(cell.row + 1)} · ${zoomText}`
}
