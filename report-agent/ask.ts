/** Blocking human input that also works inside a DS-Bot group member session. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-user-questions'
import { defineTool } from '@deepseek-ai/dsh-tools'
/** Native tool and human question services. */
export const inject = ['tools', 'userQuestions', 'systemPrompt']
/** Install the deployment's scoped question tool. @param ctx - Report agent context. */
export function apply(ctx: Context): void {
  ctx.systemPrompt.section({ name: 'report-team-interaction', order: 1000, text: '团队报告规则：你必须遵循自己的具体职责。需要用户决定用途、行业方向、读者、样式或大纲时，调用 report_ask_user，工具会弹出真人问题卡并等待答案；不能仅在文字里提问或说“等待回复”。等待期间不要转发给其他成员或启动下一轮讨论。其他成员无需重复提问，向主编指出缺口即可。用户可见回复只写业务结果，不输出内部思考、英文工作独白或对如何回复的说明。群聊没有新内容时只能输出精确的 [PASS]，不要附加任何解释。导出报告必须调用 report_generate 并等待该工具的真人确认，不能把 report_ask_user 的回答替代最终生成确认。' })
  ctx.tools.register(defineTool({ name: 'report_ask_user', description: '向用户弹出一个问题卡，并暂停当前任务直到真人答复。需要选择或缺失的关键信息时使用，不能假装已经提问。',
    parameters: { question: { type: 'string', required: true, description: '一个简短、具体的中文问题' }, options: { type: 'array', items: { type: 'string' }, description: '两到三个可选答案，也允许用户自由补充' } },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    async execute(args, exec) {
      const result = await ctx.userQuestions.ask({ agent: exec.agent, signal: exec.signal, questions: [{ id: 'report-choice', question: args.question, options: (args.options ?? []).slice(0, 4).map(label => ({ label })) }] })
      return JSON.stringify(result)
    },
  }))
}
