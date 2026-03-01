import type { TFunction } from 'i18next'
import type { ReactElement } from 'react'

import type { Theme } from '../theme/useTheme'
import languageSwitcher, { type SupportedLanguage } from './LanguageSwitcher'
import themeToggle from './ThemeToggle'

export type StatusVariant = 'loading' | 'connected' | 'error' | 'neutral'

type Props = {
  t: TFunction
  title: string
  phase: string
  statusLabel: string
  statusVariant: StatusVariant
  language: SupportedLanguage
  onLanguageChange: (lng: SupportedLanguage) => void
  theme: Theme
  onThemeChange: (next: Theme) => void
}

const dotClass = (variant: StatusVariant): string => {
  if (variant === 'loading') return 'dot dotLoading'
  if (variant === 'connected') return 'dot dotConnected'
  if (variant === 'error') return 'dot dotError'
  return 'dot dotNeutral'
}

const header = (props: Props): ReactElement => (
  <div className="card">
    <div className="cardBody">
      <div className="headerBar">
        <div className="brand">
          <h1 className="title">{props.title}</h1>
          <div className="chips">
            <span className="chip chipPhase">{props.phase}</span>
            <span className="chip chipStatus">
              <span className={dotClass(props.statusVariant)} aria-hidden />
              <span>{props.statusLabel}</span>
            </span>
          </div>
        </div>
        <div className="controls">
          {languageSwitcher({
            t: props.t,
            active: props.language,
            onSelect: props.onLanguageChange,
          })}
          {themeToggle({ t: props.t, theme: props.theme, onChange: props.onThemeChange })}
        </div>
      </div>
    </div>
  </div>
)

export default header
