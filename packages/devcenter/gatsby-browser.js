import 'progressive-web-sdk/styleguide/styleguide.scss'
import 'progressive-web-sdk/dist/components/sheet/_base.scss'
import 'progressive-web-sdk/dist/components/nav/_base.scss'
import 'progressive-web-sdk/dist/components/nav-menu/_base.scss'
import 'progressive-web-sdk/dist/components/nav-item/_base.scss'
import 'progressive-web-sdk/dist/components/nav-header/_base.scss'
import 'progressive-web-sdk/dist/components/list-tile/_base.scss'
import 'progressive-web-sdk/dist/components/tabs/_base.scss'

import React from 'react'
import GlobalContextProvider from './src/context/GlobalContextProvider'
import './src/fonts/fonts.css'

export const wrapRootElement = ({element}) => (
    <GlobalContextProvider>{element}</GlobalContextProvider>
)

export const onClientEntry = async () => {
    if (typeof IntersectionObserver === `undefined`) {
        await import(`intersection-observer`)
    }
}