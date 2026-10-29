/** Human answers are obtained from the native question service, never model arguments. */
export interface ApprovalAnswer { selected: readonly string[]; custom?: string | undefined }
/** Wait for one human response and accept only an unambiguous approval. @param ask - Native question operation. @returns Whether generation may begin. */
export async function waitForReportApproval(ask: () => Promise<{ answers: readonly ApprovalAnswer[] }>): Promise<boolean> {
  const answer = (await ask()).answers[0]
  if (!answer) return false
  const custom = answer.custom?.trim().replace(/[，。！!\s]/g, '') ?? ''
  return answer.selected.length === 1 && answer.selected[0] === '按此生成'
    || answer.selected.length === 0 && ['确认', '确认生成', '同意', '按此生成', '按这个生成', '开始生成'].includes(custom)
}
