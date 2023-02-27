import * as React from 'react'
import GlobalStyle from '../global-style'

type Props = {
    children: React.ReactNode
}

const Layout: React.FC<Props> = ({children}: Props) => {
    return <React.Fragment>
    <GlobalStyle></GlobalStyle>
    {children}
</React.Fragment>
}

export default Layout