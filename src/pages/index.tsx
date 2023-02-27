import * as React from 'react'
import type { PageProps } from 'gatsby'
import Layout from '../components/layout'

const IndexPage: React.FC<PageProps> = ({}: PageProps) => {
  return <Layout>
    <h1>Hello, World! My name is Mojila, I am a Software Engineer.</h1>
    <p>Early blog development</p>
  </Layout>
}

export const Head = () => <title>Me Mojila</title>

export default IndexPage