import { useState } from 'react'
import { Modal, Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Pending, Answer } from './question-source.ts'
import css from './brand.module.css'

interface Copy { title: string; description: string; custom: string; submit: string; cancel: string; error: string }
interface Props { pending: Pending; busy: boolean; error: boolean; answer: (id: string, answers?: Answer[]) => void; copy: Copy }
/**
 * A real question wait; no timer, preselected answer, or automatic approval.
 * @param props - Current host question and human commands.
 * @returns Modal.
 */
export function QuestionDialog({ pending, busy, error, answer, copy }: Props) {
  const [answers, setAnswers] = useState<Answer[]>(pending.questions.map(question => ({ id: question.id, selected: [] })))
  const update = (index: number, patch: Partial<Answer>) =>
    setAnswers(previous => previous.map((value, i) => i === index ? { ...value, ...patch } : value))
  const readAnswer = (index: number): Answer => {
    const value = answers[index]
    if (value === undefined) throw new Error('Question answer state is unavailable')
    return value
  }
  const ready = answers.every(value => value.selected.length > 0 || !!value.custom?.trim())
  return <Modal open title={copy.title} description={copy.description} closeLabel={copy.cancel}
    onClose={() => { if (!busy) answer(pending.id) }} className={css.questionModal ?? ''}
    footer={<><Button disabled={busy} onClick={() => answer(pending.id)}>{copy.cancel}</Button><Button variant="primary" disabled={!ready || busy} onClick={() => answer(pending.id, answers)}>{copy.submit}</Button></>}>
    <div className={css.questions}>
      {pending.questions.map((question, index) => <fieldset key={question.id} className={css.questionField} disabled={busy}>
        <legend>{question.question}</legend>
        <div className={css.questionChoices}>{question.options?.map(option => <label key={option.label} className={css.questionChoice}>
          <input type={question.multiSelect ? 'checkbox' : 'radio'} name={question.id} checked={readAnswer(index).selected.includes(option.label)} onChange={() => update(index, { selected: question.multiSelect ? readAnswer(index).selected.includes(option.label) ? readAnswer(index).selected.filter(label => label !== option.label) : [...readAnswer(index).selected, option.label] : [option.label] })} />
          <span>{option.label}{option.description && <small>{option.description}</small>}</span>
        </label>)}</div>
        <textarea aria-label={copy.custom} placeholder={copy.custom} value={readAnswer(index).custom ?? ''} onChange={event => update(index, { custom: event.target.value })} />
      </fieldset>)}
      {error && <p className={css.questionError} role="alert">{copy.error}</p>}
    </div>
  </Modal>
}
