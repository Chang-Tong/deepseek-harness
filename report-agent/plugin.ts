/** Knowledge retrieval and checked report generation inside the native Harness conversation. */
import { basename } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { field, record, ReportApi } from './api.ts'

/** Plugin identifier. */
export const name = 'industry-report-chat'
/** Runtime services consumed by the tools. */
export const inject = ['tools']
/** Deployment values; credentials stay in the report service. */
export interface Config {
  apiUrl: string
  attachmentsDirectory: string
  pollIntervalMs: number
  timeoutMs: number
  maxUploadBytes: number
}
/** Deployment configuration schema. */
export const Config: z<Config> = z.object({
  apiUrl: z.string().required(), attachmentsDirectory: z.string().required(),
  pollIntervalMs: z.number().min(10).default(1000), timeoutMs: z.number().min(1000).default(240000),
  maxUploadBytes: z.number().min(1).default(32 * 1024 * 1024),
})
const reportFields = {
  id: { type: 'string' }, status: { type: 'string' }, message: { type: 'string' },
  word_url: { type: 'string' }, html_url: { type: 'string' }, markdown_url: { type: 'string' }, content: { type: 'string' },
} as const

/** Install tools in the report agent's preset scope. @param ctx - Scoped Harness context. @param config - Local service and attachment settings. */
export function apply(ctx: Context, config: Config): void {
  const api = new ReportApi(config.apiUrl, config.pollIntervalMs)
  const signalFor = (signal: AbortSignal) => AbortSignal.any([signal, AbortSignal.timeout(config.timeoutMs)])
  ctx.tools.register(defineTool({
    name: 'knora_search', description: '检索现有 WeKnora 资料库，返回原文证据、文件名和知识/分块编号。回答资料问题前必须检索；有引用不代表事实已核验。',
    parameters: { query: { type: 'string', required: true, description: '要检索的主题或问题' } },
    output: {
      schema: { type: 'object', properties: {
        run_id: { type: 'string' }, status: { type: 'string' }, evidence: { type: 'array', items: { type: 'object', properties: {
          id: { type: 'string' }, document: { type: 'string' }, knowledge_id: { type: 'string' }, chunk_id: { type: 'string' },
          excerpt: { type: 'string' }, locator: { type: 'string' }, quality_flags: { type: 'string' },
        }, additionalProperties: false } },
      }, additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      const result = record(await api.request('/api/knowledge/search', signalFor(exec.signal), { query: args.query }))
      if (!Array.isArray(result.evidence)) throw new Error('检索证据列表无效')
      return { run_id: field(result, 'run_id'), status: field(result, 'status'), evidence: result.evidence.map((item: unknown) => {
        const hit = record(item)
        return { id: field(hit, 'id'), document: field(hit, 'source_path'), knowledge_id: field(hit, 'knowledge_id'),
          chunk_id: field(hit, 'chunk_id'), excerpt: field(hit, 'content'), locator: JSON.stringify(hit.source_locators ?? null), quality_flags: JSON.stringify(hit.quality_flags) }
      }) }
    },
  }))
  ctx.tools.register(defineTool({
    name: 'report_generate', description: '用户要求生成报告时调用。自动检索、按章写作、核对数字和引用、导出 Word/HTML/Markdown。主题明确即可生成，不要求用户填写结构化表单。只返回待核对初稿。',
    parameters: {
      title: { type: 'string', required: true, description: '从对话整理的报告主题' },
      requirements: { type: 'string', description: '用户在对话中提出的要求' },
      sections: { type: 'array', items: { type: 'string' }, description: '可选的章节标题；用户未指定时使用默认结构' },
    },
    output: { schema: { type: 'object', properties: reportFields, additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) {
      const signal = signalFor(exec.signal)
      const job = await api.generate({ title: args.title, brief: args.requirements ?? '', as_of: new Date().toLocaleDateString('sv-SE'),
        ...args.sections === undefined ? {} : { sections: args.sections } }, signal)
      const id = field(job, 'id'), status = field(job, 'status'), ready = status === 'draft_ready'
      const base = `${api.base}/api/reports/${id}/report`
      return { id, status, message: field(job, 'message'), word_url: ready ? `${base}.docx` : '',
        html_url: ready ? `${base}.html` : '', markdown_url: ready ? `${base}.md` : '', content: ready ? await api.markdown(id, signal) : '' }
    },
  }))
  ctx.tools.register(defineTool({
    name: 'knora_import_file', description: '将本次聊天附件导入 WeKnora。file_path 必须是 Harness 提供的附件本机路径，只能读取附件存储目录内的文件。提交后需要等解析完成再检索。',
    parameters: { file_path: { type: 'string', required: true, description: '聊天消息中给出的附件绝对路径' } },
    output: { schema: { type: 'object', properties: { id: { type: 'string' }, filename: { type: 'string' }, status: { type: 'string' } }, additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) {
      const signal = signalFor(exec.signal)
      const result = await api.importFile(args.file_path, config.attachmentsDirectory, config.maxUploadBytes, signal)
      return { id: field(result, 'id'), filename: basename(args.file_path), status: field(result, 'parse_status') }
    },
  }))
}
