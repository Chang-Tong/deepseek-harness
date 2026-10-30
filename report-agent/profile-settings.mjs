/** Preserve native model settings while the report launcher refreshes its generated overlay. */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
const sourcePackage = new URL('../packages/settings/settings/package.json', import.meta.url)
const installedPackage = new URL('../node_modules/@deepseek-ai/dsh-settings/package.json', import.meta.url)
const { parseDocument } = createRequire(existsSync(sourcePackage) ? sourcePackage : installedPackage)('yaml')
const credentialMode = process.argv[2] === '--credential'
const document = parseDocument(await readFile(process.argv[credentialMode ? 4 : 2], 'utf8'))
if (document.errors.length) throw new Error('Cannot preserve model settings: invalid profile document')
const rows = document.toJS()
if (credentialMode) {
  const reference = process.argv[3]
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(reference)) throw new Error('Invalid credential reference')
  const value = rows?.version === 1 ? rows.refs?.[reference] : rows?.[reference]
  process.stdout.write(JSON.stringify({ value: typeof value === 'string' && value ? value : null }))
  process.exit(0)
}
if (!Array.isArray(rows)) throw new Error('Cannot preserve model settings: expected profile patch rows')
const namespaces = new Set(['llm-pi-ai', 'llm-deepseek-api-key', 'agent-default-model'])
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const merge = (base, update) => {
  const result = { ...base }
  for (const [key, value] of Object.entries(update)) result[key] = plain(value) && plain(result[key]) ? merge(result[key], value) : value
  return result
}
const retained = new Map()
for (const row of rows) {
  if (namespaces.has(row?.id) && plain(row.config)) retained.set(row.id, merge(retained.get(row.id) ?? {}, row.config))
}
process.stdout.write(JSON.stringify([...retained].map(([id, config]) => ({ id, config }))))
