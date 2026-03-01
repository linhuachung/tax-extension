import type { ReactElement, ReactNode } from 'react'

import container from './Container'

type Props = {
  header: ReactNode
  alert: ReactNode
  main: ReactNode
  footer: ReactNode
}

const mainLayout = (props: Props): ReactElement => (
  <div className="appRoot">
    {container({
      children: (
        <div className="stack">
          {props.header}
          {props.alert}
          {props.main}
          {props.footer}
        </div>
      ),
    })}
  </div>
)

export default mainLayout
