/** China Mobile wordmark and report icon for the native chat shell. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { en, zh } from './locales.ts'
import css from './brand.module.css'
import { Button, IconGlobeOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { createNetworkSource } from './network-source.ts'
import { jiutianLogo, combinedLogo } from './brand-assets.ts'
import { imagePreviewId } from './image-result.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { cmccBrand: keyof typeof zh }
}
/** Locale and slot services consumed by this presentation. */
export const inject = ['slots', 'locale']

/** Register localized occupants into the native brand positions. @param ctx - Browser plugin context. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('cmccBrand', { zh, en }), 'cmcc-brand: dictionaries')
  ctx.effect(() => {
    const previous = document.documentElement.dataset.reportBrand
    document.documentElement.dataset.reportBrand = 'cmcc'
    return () => { if (previous === undefined) delete document.documentElement.dataset.reportBrand; else document.documentElement.dataset.reportBrand = previous }
  }, 'cmcc: report brand geometry')
  const network = createNetworkSource()
  ctx.effect(() => {
    const refresh = () => { void network.refresh() }
    refresh()
    window.addEventListener('focus', refresh)
    return () => { window.removeEventListener('focus', refresh); network.close() }
  }, 'cmcc: network preference')
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name: 'conversation.input.left', id: 'report-network', order: 50, locale: 'cmccBrand',
    inject: () => ({ hooks: { network }, toggle: () => { void network.toggle() } }),
  }, ({ useNetwork, toggle, t }) => {
    const state = useNetwork(value => value)
    return <button className={css.network} type="button" role="switch" aria-checked={state.enabled} disabled={state.busy} onClick={toggle}
      title={t(state.error ? 'networkError' : state.enabled ? 'networkOff' : 'networkOn')}><IconGlobeOutlineRegular size={15} /><span>{t(state.error ? 'networkRetry' : 'network')}</span></button>
  }))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({ name: 'conversation.input.dock', id: 'report-starters', order: 0, locale: 'cmccBrand' },
    ({ session, input, inputActions, t }) => {
      if (!session.blank || session.promptAttempted || session.running) return null
      const starters = ['work', 'industry', 'annual', 'slides', 'product', 'comparison'] as const
      return <nav className={css.starters} aria-label={t('starterLabel')}>
        {starters.map(key => <Button key={key} variant="outline" size="sm" className={css.starter}
          onClick={() => {
            const prompt = t(`${key}Prompt`)
            if (input.draft === '' || starters.some(item => input.draft === t(`${item}Prompt`))) inputActions.setDraft(prompt)
            else inputActions.insertText(`\n${prompt}`, inputActions.captureInsertion())
          }}>{t(key)}</Button>)}
      </nav>
    }))
  const mark = (size: number, label: string, className?: string) => <img className={className} src={jiutianLogo} width={size} height={size} alt={label} />
  ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({ name: 'sidebar.brand.mark', locale: 'cmccBrand' },
    ({ size, t }) => mark(size, t('name'))))
  ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name', locale: 'cmccBrand' },
    ({ t }) => <span className={css.wordmark}><img className={css.lockup} src={combinedLogo} alt={t('brandNames')} /></span>))
  for (const [key, label] of [['weknora_search', 'search'], ['weknora_read_document', 'read'], ['knora_import_file', 'import'], ['report_generate', 'generate'], ['skill', 'plan'], ['mcp__web__web_search', 'webSearch'], ['mcp__web__fetch_page', 'webRead'], ['mcp__web__find_images', 'findImages'], ['mcp__web__fetch_image', 'fetchImage']] as const) {
    ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({ name: 'tool.call.toolview', key, priority: -20, locale: 'cmccBrand' },
      ({ phase, block, t }) => {
        const id = key === 'mcp__web__fetch_image' && phase === 'result' && !block.isError ? imagePreviewId(block.content) : undefined
        return <div className={css.assetResult}><div className={css.activity} role="status"><img src={jiutianLogo} width={16} height={16} alt="" /><span>{t(label)}</span><small>{t(phase === 'result' ? block.isError ? 'failed' : 'returned' : 'working')}</small></div>
          {id && <img className={css.fetchedImage} src={`/api/report-image?id=${id}`} alt={t('fetchImage')} loading="lazy" />}</div>
      }))
  }
  ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({ name: 'conversation.hero.brand.mark', locale: 'cmccBrand' },
    ({ size, t, className }) => mark(size, t('name'), className)))
}
