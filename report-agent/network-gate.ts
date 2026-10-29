/** A real transport gate shared by the Web toggle and MCP dispatch. */
export class NetworkGate {
  enabled = false
  private control = new AbortController()
  /** Apply a human preference and cancel calls when the switch closes. @param enabled - New user choice. */
  set(enabled: boolean): void {
    if (this.enabled === enabled) return
    this.enabled = enabled
    if (!enabled) this.control.abort(new Error('联网搜索已关闭'))
    else this.control = new AbortController()
  }
  /** Require an open gate and retain caller cancellation. @param caller - Tool invocation signal. @returns Fused request signal. */
  signal(caller: AbortSignal): AbortSignal {
    if (!this.enabled) throw new Error('请先点击输入框旁的“联网搜索”按钮，再使用网络资料。')
    return AbortSignal.any([caller, this.control.signal])
  }
}
