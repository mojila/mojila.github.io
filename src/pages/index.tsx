import * as React from 'react'
import { PageProps } from 'gatsby'
import Header from '../components/Header'
import Article from '../components/Article'

const IndexPage: React.FC<PageProps> = ({ }: PageProps) => {
  return <div>
    <Header></Header>
    <Article></Article>
  </div>
}

export const Head = () => <title>Me Mojila</title>

export default IndexPage