import * as React from 'react'
import type { PageProps } from 'gatsby'
import Layout from '../components/layout'
import styled from 'styled-components'
import ReactTypingEffect from 'react-typing-effect'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const IndexPage: React.FC<PageProps> = ({}: PageProps) => {
  return <Layout>
    <Container>
      <h1><ReactTypingEffect text={["Hello, World! 🌏", "My name is Mojila 🦖", "I am a Software Engineer ⌨️"] } speed={100} eraseSpeed={100}></ReactTypingEffect></h1>
      <p>Early blog development</p>
      <h2>🏗️🏗️🏗️ Page under construction 🏗️🏗️🏗️</h2>
    </Container>
  </Layout>
}

export const Head = () => <title>Me Mojila</title>

export default IndexPage