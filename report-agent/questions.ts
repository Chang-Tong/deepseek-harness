/** A single authenticated answer surface for visible and hidden team sessions. */
import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { AskUserQuestionAnswer, AskUserQuestionRequest } from '@deepseek-ai/dsh-user-questions'
import type {} from '@deepseek-ai/dsh-client-connection'

/** Native question capability and authenticated HTTP transport. */
export const inject = ['connection', 'userQuestions']

/** Route real native question requests into the report workspace's modal. @param ctx - Host context. */
export function apply(ctx: Context): void {
  const pending = new Map<string, { request: AskUserQuestionRequest; answer: (value: AskUserQuestionAnswer) => void; cancel: () => void }>()
  ctx.on('user-questions/request', (request, next) => {
    if (!request.agent) return next()
    return new Promise<AskUserQuestionAnswer>((resolve, reject) => {
      const id = randomUUID()
      const cleanup = () => { pending.delete(id); request.signal?.removeEventListener('abort', cancel) }
      const cancel = () => { cleanup(); reject(new Error('用户提问已取消，请重新发起。')) }
      pending.set(id, { request, answer: value => { cleanup(); resolve(value) }, cancel })
      request.signal?.addEventListener('abort', cancel, { once: true })
      if (request.signal?.aborted) cancel()
    })
  }, { prepend: true })
  ctx.effect(() => () => { for (const entry of [...pending.values()]) entry.cancel() }, 'report: pending questions')
  ctx.effect(() => ctx.connection.fetch.register({ path: '/api/report-question', methods: ['GET', 'POST'], requestBody: 'buffered',
    async fetch(request) {
      if (request.method === 'POST') {
        if (request.headers.get('X-Requested-With') !== 'ReportAgent') return new Response('Invalid request', { status: 403 })
        try {
          const body = await request.json() as { id?: string; answers?: AskUserQuestionAnswer['answers']; cancel?: boolean }
          const entry = typeof body.id === 'string' ? pending.get(body.id) : undefined
          if (!entry) return new Response('Question no longer pending', { status: 409 })
          if (body.cancel === true) entry.cancel()
          else {
            if (!Array.isArray(body.answers) || body.answers.length !== entry.request.questions.length) return new Response('Invalid answers', { status: 400 })
            if (!body.answers.every((answer, i) => answer.id === entry.request.questions[i]?.id && Array.isArray(answer.selected) && answer.selected.every(value => typeof value === 'string') && (answer.custom === undefined || typeof answer.custom === 'string'))) return new Response('Invalid answers', { status: 400 })
            if (!body.answers.every((answer, i) => {
              const question = entry.request.questions[i]!
              const labels = new Set(question.options?.map(option => option.label) ?? [])
              return (answer.selected.length > 0 || !!answer.custom?.trim())
                && (question.multiSelect === true || answer.selected.length <= 1)
                && new Set(answer.selected).size === answer.selected.length
                && answer.selected.every(label => labels.has(label))
                && (answer.custom?.length ?? 0) <= 4000
            })) return new Response('Invalid choice', { status: 400 })
            entry.answer({ answers: body.answers })
          }
        } catch { return new Response('Invalid answer', { status: 400 }) }
      }
      return Response.json({ pending: [...pending].map(([id, { request }]) => ({ id, questions: request.questions })) }, { headers: { 'Cache-Control': 'no-store' } })
    },
  }), 'report: human answer transport')
}
