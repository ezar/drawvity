import type { CustomLevel } from '../types'

export function encodeLevel(lvl: CustomLevel): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(lvl))))
}

export function decodeLevel(hash: string): CustomLevel | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash)))) as CustomLevel
  } catch { return null }
}

export function buildShareURL(lvl: CustomLevel): string {
  const base = window.location.href.split('#')[0]
  return `${base}#import=${encodeLevel(lvl)}`
}

/** Read and consume the #import= hash on startup. Returns level or null. */
export function consumeImportHash(): CustomLevel | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash.startsWith('#import=')) return null
  const lvl = decodeLevel(hash.slice(8))
  if (lvl) window.location.hash = ''
  return lvl
}
