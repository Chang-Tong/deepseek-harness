import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { saveModelRoute } from './model-routes.ts'

test('selected custom settings reach the private writer handoff with write-only credentials', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'report-models-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const profile = { api: 'openai-completions', baseURL: 'https://gateway.example/v1', apiKeyEnv: 'CUSTOM_API_KEY', models: [{ id: 'model-a' }, { id: 'model-b' }] }
  await saveModelRoute(directory, { provider: 'custom', model: 'model-b' }, {
    describe: () => [{ ns: 'llm-pi-ai', value: { providers: { custom: profile } } }],
    resolve: async reference => { assert.equal(reference, 'CUSTOM_API_KEY'); return { value: 'test-only-key', source: 'file' } },
  })
  const name = createHash('sha256').update('custom\nmodel-b').digest('hex') + '.json'
  const snapshot = JSON.parse(await readFile(join(directory, name), 'utf8'))
  assert.deepEqual(snapshot.native_profile, profile)
  assert.equal(snapshot.model, 'model-b')
  assert.equal(snapshot.api_key, undefined)
  assert.ok(!JSON.stringify(snapshot).includes('test-only-key'))
  assert.equal((await stat(join(directory, name))).mode & 0o777, 0o600)
})

test('an unknown route or missing credential never becomes a usable writer route', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'report-models-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await assert.rejects(saveModelRoute(directory, { provider: 'missing', model: 'x' }, { describe: () => [], resolve: async () => undefined }), /尚未配置/)
  await assert.rejects(saveModelRoute(directory, { provider: 'custom', model: 'x' }, {
    describe: () => [{ ns: 'llm-pi-ai', value: { providers: { custom: { apiKeyEnv: 'CUSTOM_KEY' } } } }], resolve: async () => undefined,
  }), /API Key/)
})

test('account models keep their native credential path', async () => {
  await saveModelRoute('/unused', { provider: 'deepseek-account', model: 'deepseek-flash' }, {
    describe: () => { throw new Error('not used') }, resolve: async () => { throw new Error('not used') },
  })
})

test('model settings survive generated preset refreshes without accumulating patch rows', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'report-profile-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const path = join(directory, 'cordis.patch.yml')
  await writeFile(path, '- id: llm-pi-ai\n  config: {providers: {custom: {api: openai-completions, baseURL: https://gateway.example/v1}}}\n- id: llm-pi-ai\n  config: {providers: {custom: {models: [{id: new-model}]}}}\n- id: unrelated\n  config: {value: ignored}\n')
  const helper = fileURLToPath(new URL('./profile-settings.mjs', import.meta.url))
  const rows = JSON.parse(execFileSync(process.execPath, [helper, path], { encoding: 'utf8' }))
  assert.equal(rows.length, 1)
  assert.equal(rows[0].config.providers.custom.baseURL, 'https://gateway.example/v1')
  assert.equal(rows[0].config.providers.custom.models[0].id, 'new-model')
})

test('official DeepSeek settings retain their native adapter', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'report-models-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await saveModelRoute(directory, { provider: 'deepseek-official', model: 'deepseek-flash' }, {
    describe: () => [{ ns: 'llm-deepseek-api-key', value: { apiKeyEnv: 'DEEPSEEK_API_KEY', models: [{ id: 'deepseek-flash' }] } }], resolve: async () => ({ value: 'test-only-key', source: 'file' }),
  })
  const name = createHash('sha256').update('deepseek-official\ndeepseek-flash').digest('hex') + '.json'
  const saved = JSON.parse(await readFile(join(directory, name), 'utf8'))
  assert.equal(saved.native_plugin, 'llm-deepseek-api-key')
  assert.equal(saved.api_key, undefined)
})

test('the writer credential reader accepts the native versioned YAML store', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'report-credentials-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const store = join(directory, '.credentials.yaml')
  await writeFile(store, 'version: 1\nrefs:\n  CUSTOM_KEY: fixture-key\n')
  const helper = fileURLToPath(new URL('./profile-settings.mjs', import.meta.url))
  const found = JSON.parse(execFileSync(process.execPath, [helper, '--credential', 'CUSTOM_KEY', store], { encoding: 'utf8' }))
  assert.equal(found.value, 'fixture-key')
  await writeFile(store, 'version: 1\nrefs: {}\n')
  assert.equal(JSON.parse(execFileSync(process.execPath, [helper, '--credential', 'CUSTOM_KEY', store], { encoding: 'utf8' })).value, null)
})
