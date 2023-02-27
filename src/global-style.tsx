import { createGlobalStyle } from 'styled-components'

const GlobalLayout = createGlobalStyle`
  @font-face {
    font-family: 'Cascadia Code';
    font-weight: 100 900;
    font-display: swap;
    font-style: normal;
    font-named-instance: 'Regular';
    src: url(fonts/CascadiaCode-jEZzj.ttf)
  }

  body {
    background-color: #E0C9A6;
    font-family: 'Cascadia Code'
  }
`

export default GlobalLayout