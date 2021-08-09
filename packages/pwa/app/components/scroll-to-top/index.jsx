/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'

/**
 * ScrollToTop will scroll the viewport to the top whenever the current URL
 * changes. If this component doesn't meet the needs of your layout, take a look
 * at this [guide]{@link https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md}.
 *
 */
export default function ScrollToTop() {
    const {pathname} = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}
