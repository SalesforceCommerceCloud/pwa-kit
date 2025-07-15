/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '../../hooks/use-einstein'
import useDataCloud from '../../hooks/use-datacloud'

/**
 * Common analytics component for tracking page views.
 * This component sends page view events to Einstein and DataCloud
 * whenever the pathname changes.
 */
const PageAnalyticsPageView = ({pathname}) => {
    const einstein = useEinstein()
    const dataCloud = useDataCloud()

    useEffect(() => {
        if (!pathname) {
            return
        }

        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [pathname])

    return null
}

PageAnalyticsPageView.propTypes = {
    pathname: PropTypes.string
}

export default PageAnalyticsPageView
