/** Serve only the four public, bundled team portraits through native auth. */
import { readFile } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
/** Authenticated HTTP transport. */
export const inject = ['connection']
/** Register the bounded avatar asset route. @param ctx - Host context. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.connection.fetch.register({ path: '/api/report-avatar', methods: ['GET'], requestBody: 'buffered',
    async fetch(request) {
      const role = new URL(request.url).searchParams.get('role')
      if (!role || !['chief', 'researcher', 'writer', 'reviewer'].includes(role)) return new Response('Unknown avatar', { status: 404 })
      const bytes = await readFile(new URL(`./artwork/${role}.png`, import.meta.url))
      return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff' } })
    },
  }), 'report: bundled team portraits')
}
