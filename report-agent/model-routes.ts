/** Private model handoff from native settings to the isolated report writer. */
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Request route captured by the host, never supplied by model tool arguments. */
export interface ModelRoute { provider: string; model: string }
/** Host-only settings and credential access required for the handoff. */
export interface ModelSettingsAccess {
  describe(): { ns: string; value: unknown }[]
  resolve(reference: string): Promise<{ value: string; source: string } | undefined>
}
function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

/** Save the selected live route and credential reference in an owner-only file.
 * @param directory - Private directory configured by the deployment.
 * @param route - Provider/model from the current native request.
 * @param access - Host settings and credential services; values never enter tool output.
 * @returns Completion after atomic publication; account routes use native account credentials.
 */
export async function saveModelRoute(directory: string, route: ModelRoute, access: ModelSettingsAccess): Promise<void> {
  if (route.provider === 'deepseek-account') return
  const settings = access.describe()
  let profile = object(object(settings.find(row => row.ns === 'llm-pi-ai')?.value).providers)[route.provider]
  const nativePlugin = route.provider === 'deepseek-official' ? 'llm-deepseek-api-key' : undefined
  if (profile === undefined && nativePlugin) {
    profile = settings.find(row => row.ns === nativePlugin)?.value
  }
  const native = object(profile)
  if (Object.keys(native).length === 0) throw new Error('所选模型尚未配置，请在设置 → 模型中检查')
  const reference = native.apiKeyEnv
  if (reference !== undefined && (typeof reference !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(reference))) throw new Error('模型凭据配置无效')
  const key = typeof reference === 'string' ? await access.resolve(reference) : undefined
  if (reference && !key?.value) throw new Error('所选模型尚未配置 API Key，请在设置 → 模型中填写')
  const identity = createHash('sha256').update(route.provider + '\n' + route.model).digest('hex')
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const temporary = join(directory, `.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, JSON.stringify({ schema_version: 1, id: route.provider, model: route.model,
      native_profile: native, native_plugin: nativePlugin, api_key_env: reference, credential_source: key?.source }), { flag: 'wx', mode: 0o600 })
    await rename(temporary, join(directory, identity + '.json'))
  } finally {
    await rm(temporary, { force: true })
  }
}
