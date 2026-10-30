import { describe, it, expect, vi } from 'vitest'
import { registerReportArtwork } from '../src/client/team-art.ts'
import { seedReportTeam } from '../src/client/team-bootstrap.ts'

describe('report team presentation and setup', () => {
  it('replaces every legacy mascot with bundled portraits and removes all registrations on disposal', () => {
    const releases: ReturnType<typeof vi.fn>[] = []
    const shapes: { id: string; body: string; size: number }[] = []
    const theme = vi.fn((_id: string, _theme: Record<string, unknown>) => {
      const release = vi.fn(); releases.push(release); return release
    })
    const remove = registerReportArtwork({ shapes: () => ['whale', 'bunny', 'kitty'],
      registerShape: (id, shape) => { shapes.push({ id, body: shape.body('#000'), size: shape.size }); const release = vi.fn(); releases.push(release); return release }, registerTheme: theme }, 'data:image/png;base64,public')
    expect(shapes.map(shape => shape.id)).toContain('whale')
    expect(shapes.map(shape => shape.id)).toContain('reviewer')
    expect(shapes.filter(shape => shape.id !== 'whale').every(shape => shape.size === 32 && shape.body.includes('/api/report-avatar?role='))).toBe(true)
    expect(shapes.find(shape => shape.id === 'whale')?.body).not.toContain('<image')
    expect(shapes.find(shape => shape.id === 'whale')?.body).toContain('viewBox="0 0 24 24"')
    expect(theme.mock.calls[0]?.[1].css).toContain('center/cover')
    remove()
    expect(releases.every(release => release.mock.calls.length === 1)).toBe(true)
  })
  it('creates three specialists and an admin-led team once, preserving later user changes', async () => {
    const state = { mainBotId: 'chief', bots: [{ id: 'chief', name: '报告主编', instructions: '' }], rooms: [] as { id: string; name: string }[], defaultModel: 'provider/model', prefs: {} as { theme?: string } }
    const writes: string[] = []
    const call = async (endpoint: string, payload: Record<string, unknown> = {}) => {
      if (endpoint === 'state') return state
      writes.push(endpoint)
      if (endpoint === 'update-bot') { Object.assign(state.bots[0]!, payload); return state.bots[0] }
      if (endpoint === 'create-bot') { const bot = { id: String(state.bots.length), name: String(payload.name), instructions: String(payload.instructions) }; state.bots.push(bot); return bot }
      if (endpoint === 'create-room') { const room = { id: 'team', name: String(payload.name) }; state.rooms.push(room); return room }
      if (endpoint === 'set-prefs') Object.assign(state.prefs, payload)
      return {}
    }
    await seedReportTeam(call)
    expect(state.bots).toHaveLength(4)
    expect(writes.filter(name => name === 'create-room')).toHaveLength(1)
    const count = writes.length
    state.bots[0]!.instructions = 'User customized instructions'
    await seedReportTeam(call)
    expect(writes).toHaveLength(count)
    expect(state.bots[0]!.instructions).toBe('User customized instructions')
  })
})
