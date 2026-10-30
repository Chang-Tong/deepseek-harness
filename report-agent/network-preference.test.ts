import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadNetworkPreference, saveNetworkPreference } from './network-preference.ts'
test('the explicit network choice survives restart; corrupt state starts closed', () => {
  const directory = mkdtempSync(join(tmpdir(), 'report-network-'))
  try {
    const file = join(directory, 'preference.json')
    assert.equal(loadNetworkPreference(file), false)
    saveNetworkPreference(file, true)
    assert.equal(loadNetworkPreference(file), true)
    assert.equal(statSync(file).mode & 0o777, 0o600)
    saveNetworkPreference(file, false)
    assert.equal(loadNetworkPreference(file), false)
    writeFileSync(file, 'not json')
    assert.equal(loadNetworkPreference(file), false)
    writeFileSync(file, '{"enabled":"true"}')
    assert.equal(loadNetworkPreference(file), false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
