import type { ReactElement } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

type Props = {
  variant: ButtonVariant
  disabled: boolean
  label: string
  onClick: () => void
}

const classForVariant = (variant: ButtonVariant): string => {
  if (variant === 'primary') return 'btn btnPrimary'
  if (variant === 'danger') return 'btn btnDanger'
  return 'btn btnSecondary'
}

const button = (props: Props): ReactElement => (
  <button
    type="button"
    className={classForVariant(props.variant)}
    disabled={props.disabled}
    onClick={props.onClick}
  >
    {props.label}
  </button>
)

export default button
