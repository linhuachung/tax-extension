import type { TFunction } from 'i18next'
import type { ReactElement } from 'react'

import type { BackgroundViewState } from '../../domain/schemas/state'
import card from '../components/Card'
import sectionTitle from '../components/SectionTitle'

const formatTs = (ms: number | undefined): string | null => {
  if (ms === undefined) return null
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ms)
  }
}

type Props = {
  t: TFunction
  gmail: BackgroundViewState['gmail'] | undefined
}

const gmailSummaryCard = (props: Props): ReactElement => {
  const placeholder = props.t('common.placeholder')
  const messages =
    props.gmail?.profile?.messagesTotal === undefined
      ? placeholder
      : String(props.gmail.profile.messagesTotal)
  const threads =
    props.gmail?.profile?.threadsTotal === undefined
      ? placeholder
      : String(props.gmail.profile.threadsTotal)
  const historyId = props.gmail?.profile?.historyId ?? placeholder
  const lastFetched = formatTs(props.gmail?.lastProfileFetchedAt) ?? placeholder

  return card({
    children: (
      <>
        {sectionTitle({ children: props.t('sections.gmailSummary') })}
        <div className="divider" />
        <dl className="kv">
          <div className="kvItem">
            <dt className="label">{props.t('fields.messages')}</dt>
            <dd className="value">{messages}</dd>
          </div>
          <div className="kvItem">
            <dt className="label">{props.t('fields.threads')}</dt>
            <dd className="value">{threads}</dd>
          </div>
          <div className="kvItem">
            <dt className="label">{props.t('fields.historyId')}</dt>
            <dd className="value">{historyId}</dd>
          </div>
          <div className="kvItem">
            <dt className="label">{props.t('fields.lastFetched')}</dt>
            <dd className="value">{lastFetched}</dd>
          </div>
        </dl>
      </>
    ),
  })
}

export default gmailSummaryCard
