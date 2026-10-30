import test from 'node:test'
import assert from 'node:assert/strict'
import type { Context } from '@deepseek-ai/cordis'
import type { AskUserQuestionAnswer, AskUserQuestionRequest } from '@deepseek-ai/dsh-user-questions'
import { apply } from './questions.ts'

test('a hidden team question stays pending until an authenticated human answer and settles only once', async () => {
  let ask!: (request: AskUserQuestionRequest, next: () => Promise<AskUserQuestionAnswer>) => Promise<AskUserQuestionAnswer>
  let fetch!: (request: Request) => Promise<Response>
  const disposers: (() => void)[] = []
  const context = { on: (_name: string, handler: typeof ask) => { ask = handler }, effect: (effect: () => (() => void)) => { disposers.push(effect()) },
    connection: { fetch: { register: (route: { fetch: typeof fetch }) => { fetch = route.fetch; return () => {} } } } } as unknown as Context
  apply(context)
  const control = new AbortController()
  let settled = false
  const pending = ask({ agent: {} as AskUserQuestionRequest['agent'], signal: control.signal, questions: [{ id: 'choice', question: '是否生成？', options: [{ label: '按此生成' }, { label: '修改' }] }] }, async () => { throw new Error('must not fall through') }).then(answer => { settled = true; return answer })
  const response = await fetch(new Request('http://localhost/api/report-question'))
  const visible = await response.json() as { pending: { id: string }[] }
  assert.equal(visible.pending.length, 1)
  assert.equal(settled, false)
  const id = visible.pending[0]!.id
  const send = (headers: Record<string, string>, answers: unknown) => fetch(new Request('http://localhost/api/report-question', { method: 'POST', headers, body: JSON.stringify({ id, answers }) }))
  assert.equal((await send({}, [{ id: 'choice', selected: ['按此生成'] }])).status, 403)
  assert.equal(settled, false)
  const headers = { 'X-Requested-With': 'ReportAgent', 'Content-Type': 'application/json' }
  assert.equal((await send(headers, [{ id: 'wrong', selected: ['按此生成'] }])).status, 400)
  assert.equal((await send(headers, [{ id: 'choice', selected: ['made-up approval'] }])).status, 400)
  assert.equal((await send(headers, [{ id: 'choice', selected: [] }])).status, 400)
  assert.equal((await send(headers, [{ id: 'choice', selected: ['按此生成'] }])).status, 200)
  assert.deepEqual(await pending, { answers: [{ id: 'choice', selected: ['按此生成'] }] })
  assert.equal((await send(headers, [{ id: 'choice', selected: ['按此生成'] }])).status, 409)
  for (const dispose of disposers.reverse()) dispose()
})
