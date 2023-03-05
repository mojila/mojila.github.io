import * as React from 'react'
import { PageProps } from 'gatsby'
import Header from '../components/Header'

const IndexPage: React.FC<PageProps> = ({ }: PageProps) => {
  return <div>
    <Header></Header>
  </div>
}

export const Head = () => <title>Me Mojila</title>

export default IndexPage