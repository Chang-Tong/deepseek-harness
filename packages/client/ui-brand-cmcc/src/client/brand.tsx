/** China Mobile wordmark and report icon for the native chat shell. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { en, zh } from './locales.ts'
import css from './brand.module.css'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { createNetworkSource } from './network-source.ts'
import { jiutianLogo, combinedLogo } from './brand-assets.ts'
import { imagePreviewId } from './image-result.ts'
import { installReportArtwork } from './team-art.ts'
import { initializeReportTeam } from './team-bootstrap.ts'
import { createQuestionSource } from './question-source.ts'
import { QuestionDialog } from './QuestionDialog.tsx'
import { LucideIcon } from './LucideIcon.tsx'
import { createModelSource } from './model-source.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { cmccBrand: keyof typeof zh }
}
/** Locale and slot services consumed by this presentation. */
export const inject = ['slots', 'locale']

/** Register localized occupants into the native brand positions. @param ctx - Browser plugin context. */
export function apply(ctx: Context): void {
  const models = createModelSource()
  ctx.effect(() => {
    const refresh = () => { void models.refresh() }
    refresh(); window.addEventListener('focus', refresh)
    return () => { window.removeEventListener('focus', refresh); models.close() }
  }, 'cmcc: native model choices')
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name: 'conversation.input.left', id: 'report-model-choice', order: 70, locale: 'cmccBrand',
    inject: () => ({ hooks: { models }, refresh: () => { void models.refresh() }, select: (id: string, model: string) => { void models.select(id, model) } }),
  }, ({ sessionId, useModels, refresh, select, t }) => {
    const state = useModels(value => value)
    const bot = state.bots.find(item => item.id === sessionId || item.sessionId === sessionId || item.parts?.includes(sessionId))
      ?? state.bots.find(item => item.id === state.rooms.find(room => room.id === sessionId)?.admin)
    if (!bot) return null
    return <label className={css.modelChoice}><span className={css.srOnly}>{t('chooseModel')}</span><select aria-label={t('chooseModel')} value={bot.model ?? state.defaultModel ?? ''} disabled={state.busy} onFocus={refresh} onChange={event => select(bot.id, event.target.value)}>
      {state.models.filter(model => !model.needsKey).map(model => <option key={model.ref} value={model.ref}>{model.name}</option>)}
    </select>{state.error && <small role="alert">{t('modelError')}</small>}</label>
  }))
  const questions = createQuestionSource()
  ctx.effect(() => questions.start(), 'cmcc: human question wait')
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'report-human-question', locale: 'cmccBrand',
    inject: () => ({ hooks: { questions }, answer: (id: string, answers?: Parameters<typeof questions.answer>[1]) => { void questions.answer(id, answers) } }),
  }, ({ useQuestions, answer, t }) => {
    const state = useQuestions(value => value), pending = state.pending[0]
    return pending ? <QuestionDialog key={pending.id} pending={pending} busy={state.busy} error={state.error} answer={answer}
      copy={{ title: t('questionTitle'), description: t('questionDescription'), custom: t('questionCustom'), submit: t('questionSubmit'), cancel: t('questionCancel'), error: t('questionError') }} /> : null
  }))
  ctx.effect(() => installReportArtwork(combinedLogo), 'cmcc: report team artwork')
  ctx.effect(() => {
    const lifetime = new AbortController()
    void initializeReportTeam(lifetime.signal).catch(() => { if (!lifetime.signal.aborted) console.warn('报告团队初始化未完成，刷新页面可重试。') })
    return () => lifetime.abort()
  }, 'cmcc: report team initialization')
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
      title={t(state.error ? 'networkError' : state.enabled ? 'networkOff' : 'networkOn')}><LucideIcon name="globe" size={15} /><span>{t(state.error ? 'networkRetry' : 'network')}</span></button>
  }))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({ name: 'conversation.input.dock', id: 'report-starters', order: 0, locale: 'cmccBrand' },
    ({ session, input, inputActions, t }) => {
      if (!session.blank || session.promptAttempted || session.running) return null
      const starters = ['work', 'industry', 'annual', 'slides', 'product', 'comparison'] as const
      const icons = { work: 'briefcase-business', industry: 'chart-no-axes-combined', annual: 'calendar-check', slides: 'presentation', product: 'boxes', comparison: 'git-compare-arrows' } as const
      return <nav className={css.starters} aria-label={t('starterLabel')}>
        {starters.map(key => <Button key={key} variant="outline" size="sm" className={css.starter}
          onClick={() => {
            const prompt = t(`${key}Prompt`)
            if (input.draft === '' || starters.some(item => input.draft === t(`${item}Prompt`))) inputActions.setDraft(prompt)
            else inputActions.insertText(`\n${prompt}`, inputActions.captureInsertion())
          }}><LucideIcon name={icons[key]} size={17} />{t(key)}</Button>)}
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
