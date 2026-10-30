import test from 'node:test'
import assert from 'node:assert/strict'
import { reportToolAllowed, reportSkillAllowed } from './team-policy-rules.ts'

test('team tools cannot expand the dedicated report capability boundary', () => {
  for (const name of ['message_bot', 'group_relay', 'weknora_search', 'report_generate']) assert.equal(reportToolAllowed(name), true)
  for (const name of ['bash', 'read_file', 'web_search', 'read_browser', 'save_capability', 'request_secret', 'load_workspace_dependencies']) assert.equal(reportToolAllowed(name), false)
  assert.equal(reportSkillAllowed({ name: 'visual-composition' }), true)
  for (const args of [null, {}, { name: 'office' }, { name: '../SKILL.md' }]) assert.equal(reportSkillAllowed(args), false)
})
