import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ReportApi, field, record } from './api.ts'

const id = 'a'.repeat(32)

test('report generation waits for terminal state and preserves failure', async (t) => {
  let polls = 0
  const server = createServer((request, response) => {
    assert.equal(request.headers['x-requested-with'], 'ReportAgent')
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(request.method === 'POST' ? { id, status: 'queued' }
      : { id, status: ++polls > 1 ? 'failed' : 'writing', message: '资料不足' }))
  })
  t.after(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const api = new ReportApi(`http://127.0.0.1:${address.port}`, 10)
  const job = await api.generate({ title: '测试报告' }, AbortSignal.timeout(5000))
  assert.equal(job.status, 'failed')
  assert.equal(job.message, '资料不足')
  assert.equal(polls, 2)
})

test('remote endpoints and malformed wire fields are rejected', () => {
  assert.throws(() => new ReportApi('https://example.com', 10))
  assert.throws(() => record([]))
  assert.throws(() => field({ status: null }, 'status'))
})

test('cancellation does not enter the submit transport', async () => {
  const api = new ReportApi('http://127.0.0.1:1', 10)
  const control = new AbortController()
  control.abort()
  await assert.rejects(api.generate({}, control.signal), { name: 'AbortError' })
})

test('attachment import sends stored bytes and rejects files outside its root', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'report-chat-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const attachments = join(directory, 'attachments')
  await mkdir(attachments)
  await writeFile(join(attachments, 'sample.md'), 'attachment-smoke')
  await writeFile(join(directory, 'outside.md'), 'private-outside')
  let requests = 0
  const server = createServer(async (request, response) => {
    requests++
    response.setHeader('Content-Type', 'application/json')
    if (request.method === 'POST') {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      assert.match(Buffer.concat(chunks).toString(), /attachment-smoke/)
      assert.equal(request.url, '/api/documents')
      response.end(JSON.stringify({ id: 'document', parse_status: 'pending' }))
    } else {
      assert.equal(request.url, '/api/documents?keyword=sample.md')
      response.end(JSON.stringify({ items: [{ id: 'document', parse_status: requests > 2 ? 'completed' : 'processing' }] }))
    }
  })
  t.after(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const api = new ReportApi(`http://127.0.0.1:${address.port}`, 10)
  const signal = AbortSignal.timeout(5000)
  assert.equal((await api.importFile(join(attachments, 'sample.md'), attachments, 1024, signal)).id, 'document')
  await assert.rejects(api.importFile(join(directory, 'outside.md'), attachments, 1024, signal))
  assert.equal(requests, 3)
})
