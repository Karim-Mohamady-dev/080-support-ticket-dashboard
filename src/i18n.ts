import en from './locales/en/common.json'
import ar from './locales/ar/common.json'
export type Lang = 'en' | 'ar'
export const dicts: Record<Lang, Record<string, string>> = { en, ar }
export function t(lang: Lang, key: string): string { return dicts[lang][key] ?? dicts.en[key] ?? key }
export function fmt(n: number, lang: Lang): string { return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(n) }
