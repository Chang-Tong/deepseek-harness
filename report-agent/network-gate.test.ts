import test from 'node:test'
import assert from 'node:assert/strict'
import { NetworkGate } from './network-gate.ts'

test('network is closed by default, cancels active work, and preserves caller cancellation', () => {
  const gate = new NetworkGate(), caller = new AbortController()
  assert.throws(() => gate.signal(caller.signal), /联网搜索/)
  gate.set(true)
  const active = gate.signal(caller.signal)
  assert.equal(active.aborted, false)
  gate.set(true)
  assert.equal(active.aborted, false)
  gate.set(false)
  assert.equal(active.aborted, true)
  gate.set(false)
  assert.throws(() => gate.signal(caller.signal))
  gate.set(true)
  const next = gate.signal(caller.signal)
  caller.abort()
  assert.equal(next.aborted, true)
})
