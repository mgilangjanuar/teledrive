import React from 'react'
import { RouteComponentProps } from 'react-router'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps> = ({ match }) => {
  return <></>
}

export default View