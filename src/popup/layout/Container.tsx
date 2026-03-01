import type { ReactElement, ReactNode } from 'react'

type Props = {
  children: ReactNode
}

const container = (props: Props): ReactElement => <div className="container">{props.children}</div>

export default container
