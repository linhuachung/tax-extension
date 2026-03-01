import { type ReactElement, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import authenticationCard from './cards/AuthenticationCard'
import gmailSummaryCard from './cards/GmailSummaryCard'
import alert from './components/Alert'
import header, { type StatusVariant } from './components/Header'
import type { SupportedLanguage } from './components/LanguageSwitcher'
import mainLayout from './layout/MainLayout'
import { usePopupController } from './state/usePopupController'
import { initTheme, setThemePersisted, type Theme } from './theme/useTheme'

type AuthStatus = 'signed_out' | 'signing_in' | 'signed_in' | 'signing_out' | 'error'

const toSupportedLanguage = (lng: string): SupportedLanguage => {
  if (lng.startsWith('vi')) return 'vi'
  if (lng.startsWith('zh')) return 'zh'
  if (lng.startsWith('ja')) return 'ja'
  if (lng.startsWith('ko')) return 'ko'
  return 'en'
}

const statusVariantFor = (status: AuthStatus | undefined): StatusVariant => {
  if (status === undefined) return 'loading'
  if (status === 'signed_in') return 'connected'
  if (status === 'error') return 'error'
  if (status === 'signing_in' || status === 'signing_out') return 'loading'
  return 'neutral'
}

const statusLabelKeyFor = (status: AuthStatus): string => {
  if (status === 'signed_in') return 'status.connected'
  if (status === 'signed_out') return 'status.signedOut'
  if (status === 'signing_in') return 'status.signingIn'
  if (status === 'signing_out') return 'status.signingOut'
  return 'status.error'
}

const useThemeState = (): { theme: Theme; setTheme: (next: Theme) => void } => {
  const [theme, setTheme] = useState<Theme>(() => initTheme())

  useEffect(() => {
    setThemePersisted(theme)
  }, [theme])

  return { theme, setTheme }
}

const useHeaderModel = (args: {
  authStatus: AuthStatus | undefined
  t: (key: string) => string
}): { statusVariant: StatusVariant; statusLabel: string } => {
  const statusVariant = statusVariantFor(args.authStatus)
  const statusLabel =
    args.authStatus === undefined
      ? args.t('status.loading')
      : args.t(statusLabelKeyFor(args.authStatus))
  return { statusVariant, statusLabel }
}

const alertTitleFor = (args: {
  errorTitle: string | undefined
  runtimeUnavailableError: string
  t: (key: string) => string
}): string | null => {
  if (args.errorTitle === undefined) return null
  if (args.errorTitle === args.runtimeUnavailableError) return args.t('errors.runtimeUnavailable')
  return args.errorTitle
}

const renderAppMain = (args: {
  t: (key: string) => string
  auth: unknown
  gmail: unknown
  busy: boolean
  login: () => void
  logout: () => void
  refreshProfile: () => void
}): ReactElement => (
  <div className="grid">
    {authenticationCard({
      t: args.t as never,
      auth: args.auth as never,
      busy: args.busy,
      onLogin: args.login,
      onLogout: args.logout,
      onRefreshProfile: args.refreshProfile,
    })}
    {gmailSummaryCard({ t: args.t as never, gmail: args.gmail as never })}
  </div>
)

const buildAlertModel = (args: {
  error: { title: string; details: string | null } | null
  runtimeUnavailableError: string
  t: (key: string) => string
}): { title: string; details: string | null } | null => {
  if (args.error === null) return null
  const title = alertTitleFor({
    errorTitle: args.error.title,
    runtimeUnavailableError: args.runtimeUnavailableError,
    t: args.t,
  })
  return { title: title ?? '', details: args.error.details }
}

const useApp = (): ReactElement => {
  const { t, i18n } = useTranslation()
  const controller = usePopupController()
  const themeState = useThemeState()

  const language = toSupportedLanguage(i18n.language)
  const authStatus = controller.state?.auth.status as AuthStatus | undefined
  const headerModel = useHeaderModel({ authStatus, t })
  const alertModel = buildAlertModel({
    error: controller.error,
    runtimeUnavailableError: controller.runtimeUnavailableError,
    t,
  })

  const headerNode = header({
    t,
    title: t('app.productName'),
    phase: t('app.phase'),
    statusLabel: headerModel.statusLabel,
    statusVariant: headerModel.statusVariant,
    language,
    onLanguageChange: (lng) => {
      void i18n.changeLanguage(lng)
    },
    theme: themeState.theme,
    onThemeChange: themeState.setTheme,
  })

  const alertNode =
    alertModel === null ? null : alert({ title: alertModel.title, details: alertModel.details })

  const mainNode = renderAppMain({
    t,
    auth: controller.state?.auth,
    gmail: controller.state?.gmail,
    busy: controller.busy,
    login: controller.login,
    logout: controller.logout,
    refreshProfile: controller.refreshProfile,
  })

  const footerNode = <div className="footer">{t('footer.note')}</div>

  return mainLayout({ header: headerNode, alert: alertNode, main: mainNode, footer: footerNode })
}

export default useApp
