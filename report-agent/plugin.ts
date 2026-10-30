/** Knowledge retrieval and checked report generation inside the native Harness conversation. */
import { basename } from 'node:path'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-user-questions'
import type {} from '@deepseek-ai/dsh-settings'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { field, record, ReportApi } from './api.ts'
import { waitForReportApproval } from './confirmation.ts'
import { saveModelRoute } from './model-routes.ts'
import type {} from './network.ts'

/** Plugin identifier. */
export const name = 'industry-report-chat'
/** Runtime services consumed by the tools. */
export const inject = ['tools', 'userQuestions', 'reportNetwork', 'settings', 'credentials']
/** Deployment values; credentials stay in the report service. */
export interface Config {
  apiUrl: string
  publicUrl: string
  attachmentsDirectory: string
  modelRoutesDirectory: string
  pollIntervalMs: number
  timeoutMs: number
  maxUploadBytes: number
}
/** Deployment configuration schema. */
export const Config: z<Config> = z.object({
  apiUrl: z.string().required(), publicUrl: z.string().required(), attachmentsDirectory: z.string().required(),
  modelRoutesDirectory: z.string().required(),
  pollIntervalMs: z.number().min(10).default(1000), timeoutMs: z.number().min(1000).default(240000),
  maxUploadBytes: z.number().min(1).default(32 * 1024 * 1024),
})
const reportFields = {
  id: { type: 'string' }, status: { type: 'string' }, message: { type: 'string' },
  word_url: { type: 'string' }, html_url: { type: 'string' }, markdown_url: { type: 'string' }, pptx_url: { type: 'string' }, slides_url: { type: 'string' }, content: { type: 'string' },
} as const

/** Install tools in the report agent's preset scope. @param ctx - Scoped Harness context. @param config - Local service and attachment settings. */
export function apply(ctx: Context, config: Config): void {
  const api = new ReportApi(config.apiUrl, config.pollIntervalMs)
  let selectedRoute: { provider: string; model: string } | undefined
  ctx.on('agent/request', async (_payload, next) => {
    const request = await next()
    selectedRoute = { provider: request.provider, model: request.model }
    return request
  })
  const signalFor = (signal: AbortSignal) => AbortSignal.any([signal, AbortSignal.timeout(config.timeoutMs)])
  ctx.tools.register(defineTool({
    name: 'report_generate', description: '用户要求生成报告时调用。本工具自带最终大纲与样式确认卡片，请直接调用，不要用 ask_user_question 重复确认生成。自动检索、按章写作、核对数字和引用、导出 Word/HTML/Markdown。主题明确即可生成，不要求用户填写结构化表单。只返回待核对初稿。',
    parameters: {
      as_of: { type: 'string', description: '用户明确要求的研究截止日期，格式 YYYY-MM-DD；未提供时按当前北京时间' },
      title: { type: 'string', required: true, description: '从对话整理的报告主题' },
      template: { type: 'string', enum: ['industry', 'work', 'annual', 'product', 'comparison'], description: 'industry 行业研究，work 工作汇报，annual 年度总结，product 产品方案，comparison 竞品分析；默认 industry' },
      output: { type: 'string', enum: ['report','presentation'], description: 'report 导出文档；presentation 另外生成可编辑 PPTX 和离线 HTML 演示。用户要求 PPT 或网页演示时选 presentation。' },
      image_ids: { type: 'array', items: { type: 'string' }, description: '最多四张已经通过 fetch_image 获取、且与主题有关的配图编号；不能编造，图片只作示意' },
      web_urls: { type: 'array', items: { type: 'string' }, description: '联网开启后，选择已经通过网络工具阅读正文的相关网页，作为报告补充来源；不能提供未经读取的 URL' },
      style: { type: 'string', enum: ['business', 'research', 'brief'], description: 'business 移动蓝商务；research 杂志研究；brief 深色科技' },
      requirements: { type: 'string', description: '用户在对话中提出的要求' },
      sections: { type: 'array', items: { type: 'string' }, description: '可选的章节标题；用户未指定时使用默认结构' },
    },
    output: { schema: { type: 'object', properties: reportFields, additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) {
      const options = record(await api.request('/api/report-options', exec.signal))
      const template = record(record(options.templates)[args.template ?? 'industry'])
      const chapterTitles = args.sections ?? template.sections
      if (!Array.isArray(chapterTitles) || chapterTitles.some(item => typeof item !== 'string')) throw new Error('报告大纲暂不可用')
      const style = args.style ?? 'business'
      const asOf = args.as_of ?? new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Shanghai'})
      const styleNames = { business: '移动蓝商务', research: '杂志研究', brief: '深色科技' }
      const approved = await waitForReportApproval(() => ctx.userQuestions.ask({
        questions: [{ id: 'report-confirm', header: '生成前确认',
          question: `《${args.title}》\n大纲：${chapterTitles.join('；')}\n样式：${styleNames[style]}；输出：${args.output === 'presentation' ? '可编辑 PPT 与网页演示，同时保留文档' : 'Word 与 HTML 文档'}；配图：${args.image_ids?.length ?? 0} 张；研究截止要求：${asOf}。是否按此生成待核对初稿？`,
          options: [{ label: '按此生成', description: '开始查阅资料、撰写和校验' }, { label: '修改大纲', description: '先调整内容安排' }, { label: '调整样式', description: '先更换报告风格' }] }],
        ...exec.agent === undefined ? {} : { agent: exec.agent }, signal: exec.signal,
      }))
      if (!approved) return { id: '', status: 'needs_confirmation', message: '用户尚未确认生成；请继续调整大纲或样式并再次确认，尚未创建报告。', word_url: '', html_url: '', markdown_url: '', pptx_url:'', slides_url:'', content: '' }
      if (selectedRoute) await saveModelRoute(config.modelRoutesDirectory, selectedRoute, {
        describe: () => ctx.settings.describe(), resolve: reference => ctx.credentials.resolve(reference as CredentialRef),
      })
      const webSources = ctx.reportNetwork.sources(exec.agent ? String(exec.agent.id) : '', args.web_urls ?? [])
      const imageIds = ctx.reportNetwork.images(exec.agent ? String(exec.agent.id) : '', args.image_ids ?? [])
      const signal = signalFor(exec.signal)
      const job = await api.generate({ title: args.title, brief: args.requirements ?? '', template: args.template ?? 'industry', output:args.output ?? 'report',image_ids:imageIds, style, web_sources: webSources, ...selectedRoute === undefined ? {} : { writer_selection: selectedRoute }, as_of: asOf,
        sections: chapterTitles }, signal)
      const id = field(job, 'id'), status = field(job, 'status'), ready = status === 'draft_ready'
      const download = (format: string) => `${config.publicUrl.replace(/\/$/, '')}/api/report-download?id=${id}&format=${format}`
      return { id, status, message: field(job, 'message'), word_url: ready ? download('docx') : '',
        html_url: ready ? download('html') : '', markdown_url: ready ? download('md') : '', pptx_url:ready && args.output === 'presentation' ? download('pptx') : '', slides_url:ready && args.output === 'presentation' ? download('slides') : '', content: ready ? await api.markdown(id, signal) : '' }
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
