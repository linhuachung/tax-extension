import type { TFunction } from 'i18next'
import type { ReactElement } from 'react'

import type { BackgroundViewState } from '../../domain/schemas/state'
import button from '../components/Button'
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
  auth: BackgroundViewState['auth'] | undefined
  busy: boolean
  onLogin: () => void
  onLogout: () => void
  onRefreshProfile: () => void
}

const authenticationCard = (props: Props): ReactElement => {
  const placeholder = props.t('common.placeholder')

  return card({
    children: (
      <>
        {sectionTitle({ children: props.t('sections.authentication') })}

        <div className="buttonRow">
          {button({
            variant: 'primary',
            disabled: props.busy,
            label: props.t('actions.login'),
            onClick: props.onLogin,
          })}
          {button({
            variant: 'danger',
            disabled: props.busy,
            label: props.t('actions.logout'),
            onClick: props.onLogout,
          })}
          {button({
            variant: 'secondary',
            disabled: props.busy,
            label: props.t('actions.refreshProfile'),
            onClick: props.onRefreshProfile,
          })}
        </div>

        <div className="divider" />

        <dl className="kv">
          <div className="kvItem">
            <dt className="label">{props.t('fields.account')}</dt>
            <dd className="value">{props.auth?.email ?? placeholder}</dd>
          </div>
          <div className="kvItem">
            <dt className="label">{props.t('fields.lastLogin')}</dt>
            <dd className="value">{formatTs(props.auth?.lastLoginAt) ?? placeholder}</dd>
          </div>
          <div className="kvItem">
            <dt className="label">{props.t('fields.lastLogout')}</dt>
            <dd className="value">{formatTs(props.auth?.lastLogoutAt) ?? placeholder}</dd>
          </div>
        </dl>
      </>
    ),
  })
}

export default authenticationCard
