/** Decode only saved image identities; preview URLs are always constructed locally. */
/**
 * Read an image id from a persisted MCP text result.
 * @param content - Durable result blocks.
 * @returns A valid local image identity, or undefined for unrelated results.
 */
export function imagePreviewId(content: readonly unknown[]): string | undefined {
  for (const item of content) {
    if (!item || typeof item !== 'object' || !('text' in item) || typeof item.text !== 'string') continue
    try {
      const value: unknown = JSON.parse(item.text)
      if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string' && /^[a-f0-9]{64}$/.test(value.id)) return value.id
    } catch { /* Non-JSON diagnostics do not describe a downloaded image. */ }
  }
  return undefined
}
