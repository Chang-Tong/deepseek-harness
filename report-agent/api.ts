/** Loopback report API client used by the conversational report tools. */
import { setTimeout as delay } from 'node:timers/promises'
import { readFile, realpath, stat } from 'node:fs/promises'
import { basename, isAbsolute, relative } from 'node:path'

/** Validate one JSON object received across HTTP. @param value - Decoded response. @returns Validated record. */
export function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('报告服务返回了无效对象')
  return value as Record<string, unknown>
}

/** Read a required string field. @param value - Response record. @param key - Field name. @returns Validated string. */
export function field(value: Record<string, unknown>, key: string): string {
  if (typeof value[key] !== 'string') throw new Error(`报告服务缺少字段 ${key}`)
  return value[key]
}

/** HTTP transport limited to the configured local report service. */
export class ReportApi {
  readonly base: string
  constructor(base: string, readonly pollIntervalMs: number) {
    const url = new URL(base)
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('报告服务必须使用本机 HTTP 地址')
    this.base = url.origin
  }

  /** Fetch a JSON API resource. @param path - Service-relative route. @param signal - Invocation cancellation. @param body - Optional request body. @returns Decoded response. */
  async request(path: string, signal: AbortSignal, body?: object | FormData): Promise<unknown> {
    const multipart = body instanceof FormData
    const response = await fetch(this.base + path, {
      method: body === undefined ? 'GET' : 'POST', signal,
      headers: { 'X-Requested-With': 'ReportAgent', ...multipart ? {} : { 'Content-Type': 'application/json' } },
      ...body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) },
    })
    const value: unknown = await response.json()
    if (!response.ok) throw new Error(field(record(value), 'error'))
    return value
  }

  /** Submit a report and wait for its durable terminal state. Cancellation stops waiting, not the published report. @param payload - Report request. @param signal - Invocation cancellation. @returns Final job record. */
  async generate(payload: object, signal: AbortSignal): Promise<Record<string, unknown>> {
    let job = record(await this.request('/api/reports', signal, payload))
    const id = field(job, 'id')
    if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('报告任务编号无效')
    while (['queued', 'retrieving', 'writing', 'checking'].includes(field(job, 'status'))) {
      await delay(this.pollIntervalMs, undefined, { signal })
      job = record(await this.request(`/api/reports/${id}`, signal))
    }
    return job
  }

  /** Read a checked draft's Markdown. @param id - Validated task id. @param signal - Invocation cancellation. @returns Draft text. */
  async markdown(id: string, signal: AbortSignal): Promise<string> {
    const response = await fetch(`${this.base}/api/reports/${id}/report.md`, { signal })
    if (!response.ok) throw new Error('该报告尚不能下载')
    return response.text()
  }

  /** Import one file inside the configured attachment directory. @param file - Attachment path. @param directory - Allowed storage root. @param maximum - Byte limit. @param signal - Invocation cancellation. @returns Upload response. */
  async importFile(file: string, directory: string, maximum: number, signal: AbortSignal): Promise<Record<string, unknown>> {
    const root = await realpath(directory), path = await realpath(file), part = relative(root, path)
    if (!part || part.startsWith('..') || isAbsolute(part)) throw new Error('只能导入当前 Harness 附件目录内的文件')
    const info = await stat(path)
    if (!info.isFile() || info.size > maximum) throw new Error('附件不是文件或超过上传大小限制')
    const data = await readFile(path, { signal }), form = new FormData()
    form.append('file', new Blob([new Uint8Array(data)]), basename(path))
    let result = record(await this.request('/api/documents', signal, form))
    while (['pending', 'processing', 'running'].includes(String(result.parse_status ?? ''))) {
      await delay(this.pollIntervalMs, undefined, { signal })
      const listing = record(await this.request('/api/documents?keyword=' + encodeURIComponent(basename(path)), signal))
      if (!Array.isArray(listing.items)) throw new Error('资料状态暂不可用')
      const found = listing.items.map(record).find(item => item.id === result.id)
      if (found) result = found
    }
    if (result.parse_status === 'failed') throw new Error('资料解析未完成，请检查文件或换一个版本')
    return result
  }
}
