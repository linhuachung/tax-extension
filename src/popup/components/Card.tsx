import type { ReactElement, ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

const card = (props: Props): ReactElement => (
  <div className={['card', props.className].filter(Boolean).join(' ')}>
    <div className="cardBody">{props.children}</div>
  </div>
)

export default card
