/** Host-owned network preference projected as one stable observable. */
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
/** Snapshot shared by the composer controls. */
export interface NetworkState { readonly enabled: boolean; readonly ready: boolean; readonly busy: boolean; readonly error: boolean }
/** Live preference operations; all server writes are explicit user actions. */
export interface NetworkSource extends HostObservable<NetworkState> { refresh(): Promise<void>; toggle(): Promise<void>; close(): void }
/**
 * Create the network preference source.
 * @param fetcher - Authenticated same-origin transport.
 * @returns One observable and its lifecycle operations.
 */
export function createNetworkSource(fetcher: typeof fetch = fetch): NetworkSource {
  let state: NetworkState = { enabled: false, ready: false, busy: false, error: false }
  let closed = false
  const control = new AbortController(), listeners = new Set<() => void>()
  const publish = (next: NetworkState) => { if (closed) return; state = next; for (const notify of listeners) notify() }
  const request = async (enabled?: boolean) => {
    if (closed || state.busy) return
    publish({ ...state, busy: true, error: false })
    try {
      const response = await fetcher('/api/report-network', { signal: control.signal,
        ...enabled === undefined ? {} : { method: 'POST', headers: { 'Content-Type':'application/json', 'X-Requested-With':'ReportAgent' }, body:JSON.stringify({enabled}) } })
      if (!response.ok) throw new Error('Network preference unavailable')
      const value: unknown = await response.json()
      if (!value || typeof value !== 'object' || typeof (value as {enabled?:unknown}).enabled !== 'boolean') throw new Error('Invalid preference')
      publish({ enabled: (value as {enabled:boolean}).enabled, ready: true, busy: false, error: false })
    } catch { publish({ ...state, busy: false, error: true }) }
  }
  return {
    getSnapshot: () => state,
    subscribe: notify => { listeners.add(notify); return () => { listeners.delete(notify) } },
    refresh: () => request(),
    toggle: () => request(state.ready ? !state.enabled : undefined),
    close: () => { closed = true; control.abort(); listeners.clear() },
  }
}
