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
import useActiveData from '../../hooks/use-active-data'
import logger from '../../utils/logger-instance'

/**
 * Analytics component for Product List Page (PLP) that handles both search and category tracking.
 * This component sends appropriate analytics events based on whether the page is showing
 * search results or category listings.
 */
const PageAnalytics = ({isSearch, searchQuery, searchParams, category, productSearchResult}) => {
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()

    useEffect(() => {
        if (!productSearchResult) {
            return
        }

        if (isSearch) {
            // Analytics for search results
            try {
                einstein.sendViewSearch(searchQuery, productSearchResult)
            } catch (err) {
                logger.error('Einstein sendViewSearch error', {
                    namespace: 'PageAnalytics.useEffect',
                    additionalProperties: {error: err, searchQuery}
                })
            }
            dataCloud.sendViewSearchResults(searchParams, productSearchResult)
            activeData.sendViewSearch(searchParams, productSearchResult)
        } else {
            // Analytics for category pages
            try {
                einstein.sendViewCategory(category, productSearchResult)
            } catch (err) {
                logger.error('Einstein sendViewCategory error', {
                    namespace: 'PageAnalytics.useEffect',
                    additionalProperties: {error: err, category}
                })
            }
            dataCloud.sendViewCategory(searchParams, category, productSearchResult)
            activeData.sendViewCategory(searchParams, category, productSearchResult)
        }
    }, [productSearchResult])

    return null
}

PageAnalytics.propTypes = {
    isSearch: PropTypes.bool.isRequired,
    searchQuery: PropTypes.string,
    searchParams: PropTypes.object,
    category: PropTypes.object,
    productSearchResult: PropTypes.object
}

export default PageAnalytics
