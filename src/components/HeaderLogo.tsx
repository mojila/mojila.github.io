import { useStaticQuery, graphql } from 'gatsby'
import * as React from 'react'

const HeaderLogo = () => {
    const data = useStaticQuery(
        graphql`{
        logo: file (relativePath: { eq: "logo.png" }) {
          publicURL
        }
      }`
    )

    return <img className='rounded-full header-logo' src={data.logo.publicURL}></img>
}

export default HeaderLogo