import * as React from 'react'
import HeaderLogo from './HeaderLogo'
import HeaderTitle from './HeaderTitle'

export default function() {
    return <div className='header m-2 rounded flex flex-row justify-between items-center px-4'>
        <HeaderTitle></HeaderTitle>
        <HeaderLogo></HeaderLogo>
    </div>
}

