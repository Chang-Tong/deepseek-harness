/** Authenticated, same-origin downloads for checked report artifacts. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import z from '@deepseek-ai/schemastery'

/** Host service that applies the native Web authentication policy. */
export const inject = ['connection']
/** Internal report API address. */
export interface Config { apiUrl: string }
/** Deployment configuration schema. */
export const Config: z<Config> = z.object({ apiUrl: z.string().required() })
/** Register the native authenticated download endpoint. @param ctx - Host context. @param config - Internal API endpoint. */
export function apply(ctx: Context, config: Config): void {
  const api = new URL(config.apiUrl)
  if (api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname)) throw new Error('Report API must be loopback')
  ctx.effect(() => ctx.connection.fetch.register({path:'/api/report-brand',methods:['GET'],requestBody:'buffered',
    async fetch(request) {
      const asset = new URL(request.url).searchParams.get('asset')
      if (asset && !['logo', 'icon'].includes(asset)) return new Response('Invalid brand asset', {status:400})
      const response = await fetch(`${api.origin}/api/report-brand${asset ? '?asset=' + asset : ''}`, {signal:request.signal})
      return new Response(response.body, {status:response.status, headers:{'Content-Type':response.headers.get('Content-Type') ?? 'application/json', 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff'}})
    },
  }), 'report: authenticated deployment artwork')
  ctx.effect(() => ctx.connection.fetch.register({
    path: '/api/report-download', methods: ['GET'], requestBody: 'buffered',
    async fetch(request) {
      const url = new URL(request.url), id = url.searchParams.get('id'), format = url.searchParams.get('format')
      if (!id || !/^[a-f0-9]{32}$/.test(id) || !['docx', 'html', 'md', 'pptx', 'slides'].includes(format ?? '')) return new Response('Invalid report', { status: 400 })
      const filename = format === 'slides' ? 'slides.html' : `report.${format}`
      const response = await fetch(`${api.origin}/api/reports/${id}/${filename}`, { signal: request.signal })
      const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      for (const name of ['Content-Type', 'Content-Disposition']) {
        const value = response.headers.get(name)
        if (value) headers.set(name, value)
      }
      return new Response(response.body, { status: response.status, headers })
    },
  }), 'report: authenticated downloads')
  ctx.effect(() => ctx.connection.fetch.register({path:'/api/report-image',methods:['GET'],requestBody:'buffered',
    async fetch(request) {
      const id = new URL(request.url).searchParams.get('id')
      if (!id || !/^[a-f0-9]{64}$/.test(id)) return new Response('Invalid image',{status:400})
      const response = await fetch(`${api.origin}/api/report-image?id=${id}`,{signal:request.signal})
      return new Response(response.body,{status:response.status,headers:{'Content-Type':response.headers.get('Content-Type') ?? 'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
    },
  }), 'report: authenticated image preview')
}
