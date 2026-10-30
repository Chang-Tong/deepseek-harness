/** Seed the dedicated report team through DS-Bot's authenticated public API. */
interface Bot { id: string; name: string; instructions?: string; model?: string }
interface State { bots: Bot[]; rooms: { id: string; name: string }[]; mainBotId: string; defaultModel?: string; prefs: { theme?: string } }
type Call = (endpoint: string, payload?: Record<string, unknown>) => Promise<unknown>
const shared = '你是九天报告团队成员，默认中文。实质性问题先查资料库，以原文为依据；不得编造数字、日期、页码和来源。其他成员的意见仅作线索，不自动视为已核实证据。只使用内置报告技能，文件导出统一交给 report_generate，并保留真人确认卡片。不得自行执行命令、安装能力或访问任意文件。'
const chief = shared + '你负责澄清用途、读者和范围，按需委派资料研究员、报告撰稿人、事实复核员。简单任务直接完成；复杂任务最多同时委派两位，先研究再撰写与复核，最后由你统一答复。移交时带上完整需求和可核对的来源线索。'
const roles = [
  { name: '资料研究员', role: '检索与证据', avatar: { shape: 'researcher' }, color: '#167E9E', instructions: shared + '重点查阅原始资料，返回可支持的事实、原文位置、来源和证据缺口；不要代替主编承诺报告已生成。' },
  { name: '报告撰稿人', role: '结构与表达', avatar: { shape: 'writer' }, color: '#365B97', instructions: shared + '重点编排大纲与论证、保留条件和引用。遵循内容编排和视觉技能。你提供建议稿，由主编发起最终导出。' },
  { name: '事实复核员', role: '核验与审校', avatar: { shape: 'reviewer' }, color: '#60758B', instructions: shared + '独立查原文，复核数字、口径、条件、引用与结论；列出无法证实的内容。没有证据时明确说明，不把工具分数当作准确率。' },
]

/** Idempotent initialization preserves existing roles, models, and preferences. @param call - Authenticated DS-Bot operation. */
export async function seedReportTeam(call: Call): Promise<void> {
  const state = await call('state', { locale: 'zh' }) as State
  const main = state.bots.find(bot => bot.id === state.mainBotId)
  if (!main || main.name !== '报告主编') return
  if (!main.instructions) await call('update-bot', { id: main.id, instructions: chief, avatar: { shape: 'commander' }, ...(state.defaultModel ? { model: state.defaultModel } : {}) })
  const members = [main.id]
  for (const role of roles) {
    let bot = state.bots.find(item => item.name === role.name)
    if (!bot) {
      try { bot = await call('create-bot', { ...role, brief: '只用一句中文介绍职责，不做事实性判断，不调用工具。' }) as Bot }
      catch (error) {
        // Two windows may initialize together; the host owns name reservations.
        bot = ((await call('state')) as State).bots.find(item => item.name === role.name)
        if (!bot) throw error
      }
    }
    members.push(bot.id)
  }
  if (!state.rooms.some(room => room.name === '报告工作组')) {
    const room = await call('create-room', { name: '报告工作组', members, admin: main.id }) as { id: string }
    await call('update-room', { id: room.id, mode: 'admin', notice: '由报告主编统筹，按需分工研究、撰写和复核；所有结论以原始资料为依据。' })
  }
  if (!state.prefs.theme) await call('set-prefs', { theme: 'report', motion: 'quiet', layout: 'flat', accent: '#007EAD' })
}

/** Initialize once per client lifetime; the host keeps the durable roster. @param signal - Plugin lifetime. @returns Completion promise. */
export async function initializeReportTeam(signal: AbortSignal): Promise<void> {
  await seedReportTeam(async (endpoint, payload = {}) => {
    const response = await fetch('/api/bot', { signal, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint, payload }) })
    if (!response.ok) throw new Error('团队初始化暂不可用')
    const result = await response.json() as { ok: boolean; value?: unknown; error?: { message?: string } }
    if (!result.ok) throw new Error(result.error?.message ?? '团队初始化暂不可用')
    return result.value
  })
}
