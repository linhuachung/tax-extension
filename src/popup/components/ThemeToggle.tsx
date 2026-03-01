import type { TFunction } from 'i18next'
import type { ReactElement } from 'react'

import type { Theme } from '../theme/useTheme'

type Props = {
  t: TFunction
  theme: Theme
  onChange: (next: Theme) => void
}

const themeToggle = (props: Props): ReactElement => (
  <div className="segmented" role="group" aria-label={props.t('header.theme')}>
    <button
      type="button"
      className={['segmentedButton', props.theme === 'light' ? 'segmentedButtonActive' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        props.onChange('light')
      }}
    >
      {props.t('header.themeLight')}
    </button>
    <button
      type="button"
      className={['segmentedButton', props.theme === 'dark' ? 'segmentedButtonActive' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        props.onChange('dark')
      }}
    >
      {props.t('header.themeDark')}
    </button>
  </div>
)

export default themeToggle
