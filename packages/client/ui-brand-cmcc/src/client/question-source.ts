/** Native human questions projected through one host-owned observable. */
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
export interface Question { id: string; question: string; options?: { label: string; description?: string }[]; multiSelect?: boolean }
export interface Pending { id: string; questions: Question[] }
export interface Answer { id: string; selected: string[]; custom?: string }
interface Snapshot { pending: Pending[]; busy: boolean; error: boolean }
interface Source extends HostObservable<Snapshot> { start(): () => void; answer(id: string, answers?: Answer[]): Promise<void> }

/** Create one report question transport owner. @param fetcher - Same-origin fetch. @returns Observable and explicit human commands. */
export function createQuestionSource(fetcher: typeof fetch = fetch): Source {
  let state: Snapshot = { pending: [], busy: false, error: false }
  const listeners = new Set<() => void>()
  let lifetime: AbortController | undefined
  const publish = (next: Snapshot) => { state = next; for (const notify of listeners) notify() }
  const request = async (body?: object) => {
    if (!lifetime || lifetime.signal.aborted) return
    const response = await fetcher('/api/report-question', { signal: lifetime.signal,
      ...body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ReportAgent' }, body: JSON.stringify(body) } : {} })
    if (!response.ok) throw new Error('Question transport unavailable')
    const result = await response.json() as { pending: Pending[] }
    publish({ pending: result.pending, busy: false, error: false })
  }
  return {
    getSnapshot: () => state,
    subscribe: notify => { listeners.add(notify); return () => { listeners.delete(notify) } },
    start() {
      lifetime = new AbortController()
      const refresh = () => { if (!state.busy) void request().catch(() => { if (!lifetime?.signal.aborted) publish({ ...state, error: true }) }) }
      refresh()
      const timer = window.setInterval(refresh, 900)
      return () => { window.clearInterval(timer); lifetime?.abort() }
    },
    async answer(id, answers) {
      if (state.busy) return
      publish({ ...state, busy: true, error: false })
      try { await request({ id, ...answers ? { answers } : { cancel: true } }) }
      catch { publish({ ...state, busy: false, error: true }) }
    },
  }
}
