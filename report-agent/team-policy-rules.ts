/** The report deployment's capability allowlist, shared by offering and enforcement. */
const tools = new Set([
  'weknora_search', 'weknora_read_document', 'knora_import_file', 'report_generate',
  'skill', 'report_ask_user',
  'mcp__web__web_search', 'mcp__web__fetch_page', 'mcp__web__find_images', 'mcp__web__fetch_image',
  'list_bots', 'message_bot', 'stop_bot', 'create_bot', 'update_bot', 'list_bot_models',
  'create_group', 'update_group', 'delete_group', 'post_to_group', 'group_relay',
  'show_view', 'read_own_chat', 'read_group_chat', 'remember', 'forget', 'recall',
])
const skills = new Set(['report-drafting', 'content-planning', 'style-selection',
  'visual-composition', 'presentation-skill', 'frontend-slides', 'image-sourcing'])

/** Whether a report agent may offer or execute a tool. @param name - Tool identity. @returns Allow decision. */
export const reportToolAllowed = (name: string): boolean => tools.has(name)
/** Whether a skill invocation names an installed report adapter. @param args - Tool arguments. @returns Allow decision. */
export function reportSkillAllowed(args: unknown): boolean {
  return !!args && typeof args === 'object' && 'name' in args && typeof args.name === 'string' && skills.has(args.name)
}
