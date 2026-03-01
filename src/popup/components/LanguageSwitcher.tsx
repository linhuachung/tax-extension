import type { TFunction } from 'i18next'
import type { ReactElement } from 'react'

export type SupportedLanguage = 'en' | 'vi' | 'zh' | 'ja' | 'ko'

const languages: ReadonlyArray<{ code: SupportedLanguage; labelKey: string }> = [
  { code: 'en', labelKey: 'languages.en' },
  { code: 'vi', labelKey: 'languages.vi' },
  { code: 'zh', labelKey: 'languages.zh' },
  { code: 'ja', labelKey: 'languages.ja' },
  { code: 'ko', labelKey: 'languages.ko' },
]

type Props = {
  t: TFunction
  active: SupportedLanguage
  onSelect: (lng: SupportedLanguage) => void
}

const languageSwitcher = (props: Props): ReactElement => (
  <div className="segmented" role="group" aria-label={props.t('header.language')}>
    {languages.map((lng) => (
      <button
        key={lng.code}
        type="button"
        className={['segmentedButton', lng.code === props.active ? 'segmentedButtonActive' : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          props.onSelect(lng.code)
        }}
      >
        {props.t(lng.labelKey)}
      </button>
    ))}
  </div>
)

export default languageSwitcher
