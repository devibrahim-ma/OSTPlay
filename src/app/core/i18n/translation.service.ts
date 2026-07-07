import { Injectable, signal, computed } from '@angular/core';
import { ES_TRANSLATIONS } from './es';
import { EN_TRANSLATIONS } from './en';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  currentLang = signal<'es' | 'en'>('es');

  englishToSpanishMap = new Map<string, string>();
  private translatedTitlesCache = new Map<string, string[]>();
  private translationCache = new Map<string, string>();

  // Computed translation dictionary based on current language
  translations = computed(() => {
    return this.currentLang() === 'en' ? EN_TRANSLATIONS : ES_TRANSLATIONS;
  });

  constructor() {
    this.initLanguage();
  }

  private initLanguage() {
    const saved = localStorage.getItem('ostplay_lang');
    if (saved === 'es' || saved === 'en') {
      this.currentLang.set(saved);
    } else {
      const browserLang = navigator.language || 'es';
      const defaultLang = browserLang.toLowerCase().startsWith('en') ? 'en' : 'es';
      this.currentLang.set(defaultLang);
      localStorage.setItem('ostplay_lang', defaultLang);
    }
  }

  setLanguage(lang: 'es' | 'en') {
    this.currentLang.set(lang);
    localStorage.setItem('ostplay_lang', lang);
  }

  /**
   * Translates a dot-notation key (e.g. 'NAVBAR.PROGRESS')
   */
  t(key: string): string {
    const keys = key.split('.');
    let obj: any = this.translations();
    for (const k of keys) {
      if (obj && obj[k] !== undefined) {
        obj = obj[k];
      } else {
        return key; // Fallback to returning the key itself
      }
    }
    return obj;
  }

  /**
   * Free Translate API call helper
   */
  async translateText(text: string, from: string, to: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data[0]) {
        let translated = '';
        for (const part of data[0]) {
          if (part && part[0]) {
            translated += part[0];
          }
        }
        return translated;
      }
    } catch (e) {
      console.error('Translation error:', e);
    }
    return text;
  }

  async translateEsToEn(text: string): Promise<string> {
    if (this.currentLang() === 'es') return text;
    const cacheKey = `es_en:${text}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }
    const translated = await this.translateText(text, 'es', 'en');
    this.translationCache.set(cacheKey, translated);
    return translated;
  }

  async translateEnToEs(text: string): Promise<string> {
    const cacheKey = `en_es:${text}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }
    const translated = await this.translateText(text, 'en', 'es');
    this.translationCache.set(cacheKey, translated);
    return translated;
  }

  async getTranslatedTitles(titles: string[]): Promise<string[]> {
    if (this.currentLang() === 'es') return titles;
    const cacheKey = titles.join(',');
    if (this.translatedTitlesCache.has(cacheKey)) {
      return this.translatedTitlesCache.get(cacheKey)!;
    }
    const translated = await this.translateTitles(titles);
    this.translatedTitlesCache.set(cacheKey, translated);
    return translated;
  }

  async translateTitles(titles: string[]): Promise<string[]> {
    if (titles.length === 0) return [];
    
    const chunkSize = 80;
    const translatedArray: string[] = [];
    
    try {
      const promises: Promise<string[]>[] = [];
      for (let i = 0; i < titles.length; i += chunkSize) {
        const chunk = titles.slice(i, i + chunkSize);
        promises.push(this.translateChunk(chunk));
      }
      
      const results = await Promise.all(promises);
      for (const res of results) {
        translatedArray.push(...res);
      }
      
      // Populate map to match English autocomplete selection back to original Spanish Firestore entries
      this.englishToSpanishMap.clear();
      for (let i = 0; i < titles.length; i++) {
        const original = titles[i];
        const translated = translatedArray[i] || original;
        this.englishToSpanishMap.set(translated.toLowerCase().trim(), original.toLowerCase().trim());
      }
      
      return translatedArray;
    } catch (e) {
      console.error('Batch translation error:', e);
    }
    return titles;
  }

  private async translateChunk(chunk: string[]): Promise<string[]> {
    try {
      const separator = ' | ';
      const joined = chunk.join(separator);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(joined)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data[0]) {
        let translatedJoined = '';
        for (const part of data[0]) {
          if (part && part[0]) {
            translatedJoined += part[0];
          }
        }
        return translatedJoined.split(separator).map(t => t.trim());
      }
    } catch (e) {
      console.error('Chunk translation error:', e);
    }
    return chunk;
  }
}
