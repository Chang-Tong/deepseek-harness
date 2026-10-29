import test from 'node:test'
import assert from 'node:assert/strict'
import { waitForReportApproval } from './confirmation.ts'

test('generation remains pending until an actual human answer arrives', async () => {
  let answer!: (value: { answers: { selected: string[] }[] }) => void
  let settled = false
  const response = new Promise<{ answers: { selected: string[] }[] }>(resolve => { answer = resolve })
  const pending = waitForReportApproval(() => response).then(value => { settled = true; return value })
  await Promise.resolve()
  assert.equal(settled, false)
  answer({ answers: [{ selected: ['按此生成'] }] })
  assert.equal(await pending, true)
})
test('edits, ambiguous confirmations and absent answers never approve generation', async () => {
  for (const answers of [[], [{ selected: ['修改大纲'] }], [{ selected: [], custom: '确认不要生成' }], [{ selected: ['按此生成', '修改大纲'] }]]) {
    assert.equal(await waitForReportApproval(async () => ({ answers })), false)
  }
  assert.equal(await waitForReportApproval(async () => ({ answers: [{ selected: [], custom: '确认生成。' }] })), true)
})
