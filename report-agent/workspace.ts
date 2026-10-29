/** Establish the report workspace before the native Web conversation opens. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-workspace'
import z from '@deepseek-ai/schemastery'

/** Runtime service consumed by the initializer. */
export const inject = ['workspaceRegistry']
/** Existing local project directory. */
export interface Config { directory: string }
/** Deployment configuration schema. */
export const Config: z<Config> = z.object({ directory: z.string().required() })
/** Initialize the first-use workspace without a directory-picker interaction. @param ctx - Host context. @param config - Existing project directory. */
export async function apply(ctx: Context, config: Config): Promise<void> {
  await ctx.workspaceRegistry.initializeDefault(async () => config.directory)
}
