/** Model metadata comes from the native provider catalog through DS-Bot's API. */
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
interface Bot { id: string; sessionId: string; parts?: string[]; model?: string }
interface Room { id: string; admin?: string }
interface Model { ref: string; name: string; providerName?: string; needsKey?: boolean }
interface Snapshot { bots: Bot[]; rooms: Room[]; models: Model[]; defaultModel?: string; busy: boolean; error: boolean }
interface Source extends HostObservable<Snapshot> {
  refresh(): Promise<void>
  select(bot: string, model: string): Promise<void>
  close(): void
}
/**
 * Create the shared provider metadata owner; credentials never enter this source.
 * @returns Native model operations and observable.
 */
export function createModelSource(): Source {
  let state: Snapshot = { bots: [], rooms: [], models: [], busy: false, error: false }
  const controller = new AbortController(), listeners = new Set<() => void>()
  const publish = (next: Snapshot) => { if (!controller.signal.aborted) { state = next; for (const notify of listeners) notify() } }
  const call = async (endpoint: string, payload: object = {}) => {
    const response = await fetch('/api/bot', { signal: controller.signal, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint, payload }) })
    if (!response.ok) throw new Error('Model settings unavailable')
    const result = await response.json() as { ok: boolean; value: Snapshot }
    if (!result.ok) throw new Error('Model settings unavailable')
    return result.value
  }
  const refresh = async () => {
    if (state.busy || controller.signal.aborted) return
    try { const value = await call('state'); publish({ bots: value.bots, rooms: value.rooms, models: value.models, ...(value.defaultModel ? { defaultModel: value.defaultModel } : {}), busy: false, error: false }) }
    catch { publish({ ...state, error: true }) }
  }
  return {
    getSnapshot: () => state,
    subscribe: (notify) => { listeners.add(notify); return () => { listeners.delete(notify) } },
    refresh,
    async select(bot, model) {
      publish({ ...state, busy: true, error: false })
      try { await call('update-bot', { id: bot, model }); publish({ ...state, busy: false }); await refresh() }
      catch { publish({ ...state, busy: false, error: true }) }
    },
    close() { controller.abort(); listeners.clear() },
  }
}
