import type { ReactElement } from 'react'

type Props = {
  title: string
  details: string | null
}

const alert = (props: Props): ReactElement => (
  <div className="alert" role="alert">
    <div className="alertTitle">{props.title}</div>
    {props.details === null ? null : <div className="alertDetails">{props.details}</div>}
  </div>
)

export default alert
