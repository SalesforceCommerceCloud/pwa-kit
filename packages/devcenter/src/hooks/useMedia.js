import {useMediaQuery} from 'react-responsive'
import {breakpoints} from '../styles/media'

export const breakPointsMap = breakpoints.reduce((acc, next) => {
    return {
        ...acc,
        [next[0]]: next[1]
    }
}, {})

export const Desktop = ({children}) => {
    const isDesktop = useMediaQuery({minWidth: breakPointsMap.tablet + 1})
    return isDesktop ? children : null
}

export const DesktopLarge = ({children}) => {
    const isDesktopLarge = useMediaQuery({minWidth: breakPointsMap.desktop_medium + 1})
    return isDesktopLarge ? children : null
}

export const DesktopMedium = ({children}) => {
    const isDesktopMedium = useMediaQuery({
        minWidth: breakPointsMap.desktop + 1,
        maxWidth: breakPointsMap.desktop_medium
    }) // 961 1280
    return isDesktopMedium ? children : null
}

export const Tablet = ({children}) => {
    const isTablet = useMediaQuery({
        minWidth: breakPointsMap.tablet,
        maxWidth: breakPointsMap.desktop
    }) // 768 960
    return isTablet ? children : null
}
export const TabletOrSmaller = ({children}) => {
    const isMobile = useMediaQuery({maxWidth: breakPointsMap.tablet})
    return isMobile ? children : null
}
export const Default = ({children}) => {
    const isNotMobile = useMediaQuery({minWidth: breakPointsMap.tablet + 1}) // 769
    return isNotMobile ? children : null
}
