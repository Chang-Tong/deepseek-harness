import { describe, it, expect } from 'vitest'
import { createNetworkSource } from '../src/client/network-source.ts'

describe('network preference', () => {
  it('starts closed and only enables after a successful server write', async () => {
    let enabled = false
    const requests: RequestInit[] = []
    const source = createNetworkSource((async (_url, init) => {
      requests.push(init ?? {})
      if (init?.method === 'POST') enabled = (JSON.parse(String(init.body)) as {enabled:boolean}).enabled
      return Response.json({enabled})
    }) as typeof fetch)
    let changes = 0
    const unsubscribe = source.subscribe(() => { changes++ })
    expect(source.getSnapshot().enabled).toBe(false)
    await source.toggle()
    expect(source.getSnapshot().enabled).toBe(false)
    await source.toggle()
    expect(source.getSnapshot().enabled).toBe(true)
    expect(requests[1]?.headers).toEqual({'Content-Type':'application/json','X-Requested-With':'ReportAgent'})
    await source.toggle()
    expect(source.getSnapshot().enabled).toBe(false)
    expect(changes).toBeGreaterThan(2)
    unsubscribe();source.close()
    await source.refresh()
    expect(requests).toHaveLength(3)
  })
  it('does not report success on HTTP, malformed data, or transport failure', async () => {
    for (const fail of [async () => new Response('',{status:503}), async () => Response.json({enabled:'yes'}), async () => { throw new Error('offline') }]) {
      const source = createNetworkSource(fail as typeof fetch)
      await source.refresh()
      expect(source.getSnapshot()).toMatchObject({enabled:false,error:true,busy:false})
      source.close()
    }
  })
  it('ignores duplicate gestures and does not publish after disposal', async () => {
    let resolve!: (response:Response) => void
    const pending = new Promise<Response>(done => { resolve = done })
    let count = 0
    const source = createNetworkSource((() => { count++; return pending }) as typeof fetch)
    const loading = source.refresh()
    await source.refresh()
    expect(count).toBe(1)
    source.close();resolve(Response.json({enabled:true}));await loading
    expect(source.getSnapshot().enabled).toBe(false)
  })
})
