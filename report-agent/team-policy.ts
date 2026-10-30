/** Dedicated report agents retain the same tool boundary in team conversations. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import { reportToolAllowed, reportSkillAllowed } from './team-policy-rules.ts'

/** Scoped report-preset services. */
export const inject = ['tools', 'skills']

/** Filter model offers and enforce the boundary again at execution. @param ctx - Agent-scoped context. */
export function apply(ctx: Context): void {
  for (const name of ['office', 'office-tools']) ctx.skills.register({ name, description: 'Use the installed report skills.', content: '', source: 'runtime', invocation: { modelInvocable: false, userInvocable: false } })
  let liftMask: (() => void) | undefined
  ctx.effect(() => () => liftMask?.(), 'report-team: visibility policy')
  ctx.effect(() => ctx.tools.guard(exec => {
    if (!reportToolAllowed(exec.name)) return '此助手仅开放资料检索、报告制作和团队协作。'
    if (exec.name === 'skill' && !reportSkillAllowed(exec.arguments)) return '请选择内置的报告制作技能。'
    return undefined
  }), 'report-team: execution policy')
  ctx.on('agent/request', async (_event, next) => {
    // MCP tools can arrive after agent creation. Refresh the global-tool mask
    // at request admission; scoped report tools remain owned by this preset.
    liftMask?.()
    liftMask = ctx.tools.restrict({ deny: ctx.tools.schemas().filter(tool => !reportToolAllowed(tool.name)).map(tool => tool.name) })
    return next()
  })
}
