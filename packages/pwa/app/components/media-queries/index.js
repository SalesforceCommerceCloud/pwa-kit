import React from 'react'
import MediaQuery from 'react-responsive'
import {BREAKPOINTS} from '../../responsive-config'

export const Desktop = (props) => {
    return <MediaQuery minWidth={BREAKPOINTS.LARGE} {...props} />
}

export const Tablet = (props) => {
    return <MediaQuery minWidth={BREAKPOINTS.MEDIUM} maxWidth={BREAKPOINTS.LARGE - 1} {...props} />
}

export const TabletOrSmaller = (props) => {
    return <MediaQuery maxWidth={BREAKPOINTS.LARGE - 1} {...props} />
}

export const Mobile = (props) => {
    return <MediaQuery maxWidth={BREAKPOINTS.MEDIUM - 1} {...props} />
}
