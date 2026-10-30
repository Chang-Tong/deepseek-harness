/** Original editorial portraits registered through DS-Bot's public artwork seam. */
import { iconMarkup } from './lucide-icons.ts'
interface Shape {
  label: string
  size: number
  eyes: { at: [[number, number], [number, number]]; w: number; h: number }
  body: (paint: string) => string
}
interface Hub {
  shapes: () => string[]
  registerShape: (id: string, shape: Shape) => () => void
  registerTheme: (id: string, theme: Record<string, unknown>) => () => void
}
declare global {
  interface Window {
    dshBot?: Hub
    dshBotQueue?: { push: (task: (hub: Hub) => void) => unknown }
  }
}

const portraits = ['chief', 'researcher', 'writer', 'reviewer']
const labels = ['指挥官', '研究员', '撰稿人', '复核员'] as const

/**
 * Register overrides, including the legacy mascot ids, with a reversible lifetime.
 * @param hub - Public DS-Bot artwork registry.
 * @param logo - Official brand lockup.
 * @returns Disposer.
 */
export function registerReportArtwork(hub: Hub, logo: string): () => void {
  const ids = [...new Set([...hub.shapes(), 'commander', 'researcher', 'writer', 'reviewer'])]
  const disposers = ids.map((id, i) => {
    const index = id === 'whale' || id === 'commander' ? 0 : id === 'researcher' ? 1 : id === 'writer' ? 2 : id === 'reviewer' ? 3 : i % 4
    return hub.registerShape(id, { label: id === 'whale' ? '设置' : (labels[index] ?? labels[0]), size: 32, eyes: { at: [[0, 0], [0, 0]], w: 0, h: 0 },
      body: paint => id === 'whale'
        ? `<svg x="5" y="5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${paint}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconMarkup.settings}</svg>`
        : `<svg width="32" height="32" viewBox="0 0 32 32"><image href="/api/report-avatar?role=${portraits[index]}&amp;v=1" width="32" height="32" preserveAspectRatio="xMidYMid slice"/></svg>` })
  })
  disposers.push(hub.registerTheme('report', {
    label: '专业报告',
    light: { bg: '#F7F9FC', sidebar: '#EEF2F7', bubble: '#FFFFFF', card: '#FFFFFF', text: '#182A43', user: '#E5EDF7', userText: '#182A43', accent: '#007EAD' },
    dark: { bg: '#101927', sidebar: '#111F31', bubble: '#18283C', card: '#1C2E44', text: '#E5EDF7', user: '#243C57', userText: '#F1F7FF', accent: '#58C8E5' },
    css: `html[data-report-brand=report] .bt-side-top{justify-content:space-between;min-height:48px}
      html[data-report-brand=report] .bt-side-top .bt-brand{min-width:0;flex:1;padding-left:0}
      html[data-report-brand=report] .bt-side-top .bt-brand>*{display:none}
      html[data-report-brand=report] .bt-side-top .bt-brand::before{content:'行业报告助手';font-size:0;display:block;width:188px;max-width:100%;height:40px;background:url("${logo}") center/cover no-repeat}
      html[data-report-brand=report] .bt-mark .bt-eye,html[data-report-brand=report] .bt-mark .bt-eye-happy{display:none}
      html[data-report-brand=report] .bt-mark :is(.bt-b,.bt-mark-img){animation:none!important}
      html[data-report-brand=report] .bt-mark>svg{width:100%!important;height:100%!important;overflow:hidden;border-radius:inherit}
      html[data-report-brand=report] .bt-tile>.bt-mark{overflow:hidden}
      html[data-report-brand=report] .bt-tile,html[data-report-brand=report] .bt-row{border-radius:10px}
      html[data-report-brand=report] .bt-brand-whale{display:none}
      html[data-report-brand=report] .bt-side{padding:16px 14px!important;background:#F0F5FB!important;border-right:1px solid #E1E9F2}
      html[data-report-brand=report] .bt-side-top{flex-wrap:wrap;gap:8px;padding:0 0 14px!important}
      html[data-report-brand=report] .bt-side-top .bt-brand{flex:0 0 100%;height:44px;margin-bottom:4px}
      html[data-report-brand=report] .bt-side-top .bt-brand::before{width:200px;height:44px;margin:0 auto}
      html[data-report-brand=report] .bt-side-top .bt-round{width:30px;height:30px;border-radius:8px;box-shadow:none;border:1px solid #DFE8F3;background:#FFF}
      html[data-report-brand=report] .bt-tile-wrap{padding:6px 0 14px}
      html[data-report-brand=report] .bt-tile{display:grid;grid-template-columns:40px 1fr;column-gap:10px;row-gap:2px;width:100%;padding:12px;text-align:left;border:1px solid #DFE8F3;background:#FFF;border-radius:12px}
      html[data-report-brand=report] .bt-tile>.bt-mark{grid-row:1/span 2;width:40px!important;height:40px!important;border-radius:10px;background:#E8F2FE}
      html[data-report-brand=report] .bt-tile-name{max-width:none;font-size:14px;font-weight:600;align-self:end}
      html[data-report-brand=report] .bt-tile .bt-chip{grid-column:2;justify-self:start;border:0;padding:0;background:transparent;font-size:11px}
      html[data-report-brand=report] .bt-badge-main{display:none}
      html[data-report-brand=report] .bt-row{min-height:58px;gap:10px;padding:10px;border:1px solid transparent}
      html[data-report-brand=report] .bt-row[aria-current=page]{background:#E5F0FF;border-color:#CDDEF5}
      html[data-report-brand=report] .bt-row>.bt-mark{width:34px!important;height:34px!important;border-radius:9px;background:#FFFFFF}
      html[data-report-brand=report] .bt-row-name{font-size:13px;font-weight:550}
      html[data-report-brand=report] .bt-row-preview{font-size:11px;line-height:17px;opacity:.75}
      html[data-report-brand=report] [class*="_composerStack"]{--report-content-width:896px;align-items:center;gap:12px}
      html[data-report-brand=report] [class*="_root"]:has(>[data-composer-card]){box-sizing:border-box;width:100%;max-width:944px!important;margin:0 auto!important;padding:0 24px 24px!important}
      html[data-report-brand=report] [data-composer-card]{display:grid!important;grid-template-columns:1fr auto!important;gap:12px!important;min-height:126px!important;width:100%!important;max-width:896px!important;padding:16px!important;border:1px solid #D7E3F1!important;border-radius:16px!important;background:#FFF!important;box-shadow:0 8px 32px #0A426B0A!important}
      html[data-report-brand=report] [data-composer-card]>[data-input-scroll]{grid-column:1/-1;grid-row:1;padding:0!important;margin:0!important;width:100%;min-height:40px!important}
      html[data-report-brand=report] [data-composer-card] [class*="_tools"]{grid-column:1;grid-row:2;align-self:center!important;gap:8px!important}
      html[data-report-brand=report] [data-composer-card] [class*="_trailing"]{grid-column:2;grid-row:2;align-self:center!important;justify-self:end}
      html[data-report-brand=report] [data-composer-card] [data-composer-input]{font-size:14px!important;line-height:22px!important;min-height:32px!important}
      html[data-report-brand=report] [data-composer-card] [data-composer-placeholder]{top:2px!important}
      html[data-report-brand=report] [data-composer-placeholder]::before{line-height:22px!important;color:#8A9AAF!important}
      html[data-report-brand=report] [data-composer-card] :is(.bt-plus,.bt-mic,.bt-voice,button[class*="_primary"]){width:30px!important;height:30px!important;border-radius:8px!important}
      html[data-report-brand=report] [data-composer-dock]{display:flex!important}
      @media(max-width:640px){html[data-report-brand=report] [class*="_root"]:has(>[data-composer-card]){padding:0 16px 16px!important}html[data-report-brand=report] [data-composer-card]{min-height:120px!important;padding:12px!important}}
      @media(max-width:640px){html[data-report-brand=report] .bt-side-top .bt-brand::before{width:156px}}`,
  }))
  return () => { for (const dispose of disposers.reverse()) dispose() }
}

/**
 * Queue artwork until DS-Bot loads and clean up only this extension.
 * @param logo - Brand lockup.
 * @returns Disposer.
 */
export function installReportArtwork(logo: string): () => void {
  let disposed = false
  let remove: (() => void) | undefined
  const register = (hub: Hub) => { if (!disposed) { remove?.(); remove = registerReportArtwork(hub, logo) } }
  if (window.dshBot) register(window.dshBot)
  else {
    const queue = window.dshBotQueue ?? (window.dshBotQueue = [] as ((hub: Hub) => void)[])
    queue.push(register)
  }
  return () => { disposed = true; remove?.() }
}
