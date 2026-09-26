export const prototypeCopyKeys = [
  'opportunity',
  'dragHint',
  'buyProduct',
  'placeStation',
  'moveStation',
  'validDrop',
  'invalidDrop',
  'invalidOpportunityDrop',
  'insufficientCash',
  'stationPlaced',
  'stationMoved',
  'delivered',
  'processing',
  'adjacencyBonus',
  'cash',
  'trust',
  'retry',
  'cancel',
] as const

export type PrototypeTextKey = (typeof prototypeCopyKeys)[number]
export type PrototypeLocale = 'en' | 'ar'

const copy: Record<PrototypeLocale, Record<PrototypeTextKey, string>> = {
  en: {
    opportunity: 'Customer opportunity',
    dragHint: 'Drag onto a Product station',
    buyProduct: 'Buy Product',
    placeStation: 'Place station',
    moveStation: 'Move station',
    validDrop: 'Looks good here',
    invalidDrop: 'Choose an open space',
    invalidOpportunityDrop: 'Drop onto a Product station',
    insufficientCash: 'Not enough cash',
    stationPlaced: 'Product station placed',
    stationMoved: 'Station moved',
    delivered: 'Opportunity delivered!',
    processing: 'Processing opportunity…',
    adjacencyBonus: 'Adjacent station bonus',
    cash: 'Cash',
    trust: 'Trust',
    retry: 'Try again',
    cancel: 'Cancel',
  },
  ar: {
    opportunity: 'فرصة عميل',
    dragHint: 'اسحب إلى محطة منتج',
    buyProduct: 'اشترِ محطة منتج',
    placeStation: 'ضع المحطة',
    moveStation: 'حرّك المحطة',
    validDrop: 'المكان مناسب',
    invalidDrop: 'اختر مساحة خالية',
    invalidOpportunityDrop: 'أسقط على محطة منتج',
    insufficientCash: 'النقد غير كافٍ',
    stationPlaced: 'وُضعت محطة المنتج',
    stationMoved: 'نُقلت المحطة',
    delivered: 'تم تسليم الفرصة!',
    processing: 'جاري تنفيذ الفرصة…',
    adjacencyBonus: 'مكافأة المحطات المتجاورة',
    cash: 'النقد',
    trust: 'الثقة',
    retry: 'حاول مجددًا',
    cancel: 'إلغاء',
  },
}

export function prototypeText<K extends PrototypeTextKey>(
  locale: PrototypeLocale,
  key: K,
): (typeof copy)[PrototypeLocale][K] {
  return copy[locale][key]
}
