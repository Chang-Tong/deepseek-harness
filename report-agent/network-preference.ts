/** A private preference file; fetched sources and image evidence stay conversation-bound. */
import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs'
import { dirname } from 'node:path'

/** Restore only a well-formed boolean, otherwise start closed. @param path - Private deployment file. @returns Explicit saved choice. */
export function loadNetworkPreference(path?: string): boolean {
  if (!path || !existsSync(path)) return false
  try { return JSON.parse(readFileSync(path, 'utf8')).enabled === true } catch { return false }
}
/** Atomically retain the explicit user choice before publishing it. @param path - Private deployment file. @param enabled - User-selected state. */
export function saveNetworkPreference(path: string | undefined, enabled: boolean): void {
  if (!path) return
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temporary = `${path}.${process.pid}.tmp`
  writeFileSync(temporary, JSON.stringify({ enabled }) + '\n', { mode: 0o600 })
  renameSync(temporary, path)
}
