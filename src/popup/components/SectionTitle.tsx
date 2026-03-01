import type { ReactElement } from 'react'

type Props = {
  children: string
}

const sectionTitle = (props: Props): ReactElement => (
  <h2 className="sectionTitle">{props.children}</h2>
)

export default sectionTitle
