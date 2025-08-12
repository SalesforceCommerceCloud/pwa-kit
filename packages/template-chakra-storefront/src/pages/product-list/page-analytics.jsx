/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useEinstein} from '../../hooks/use-einstein'
import {useDataCloud} from '../../hooks/use-datacloud'
import {useActiveData} from '../../hooks/use-active-data'
import logger from '../../utils/logger-instance'

const PageAnalytics = ({productSearchResult, category, searchQuery, isSearch, searchParams}) => {
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()

    useEffect(() => {
        if (!productSearchResult) {
            return
        }

        if (isSearch) {
            try {
                einstein.sendViewSearch(searchQuery, productSearchResult)
            } catch (err) {
                logger.error('Einstein sendViewSearch error', {
                    namespace: 'ProductList.PageAnalytics.useEffect',
                    additionalProperties: {error: err, searchQuery}
                })
            }
            dataCloud.sendViewSearchResults(searchParams, productSearchResult)
            activeData.sendViewSearch(searchParams, productSearchResult)
        } else if (category) {
            try {
                einstein.sendViewCategory(category, productSearchResult)
            } catch (err) {
                logger.error('Einstein sendViewCategory error', {
                    namespace: 'ProductList.PageAnalytics.useEffect',
                    additionalProperties: {error: err, category}
                })
            }
            dataCloud.sendViewCategory(searchParams, category, productSearchResult)
            activeData.sendViewCategory(searchParams, category, productSearchResult)
        }
    }, [productSearchResult, isSearch, searchQuery, category, searchParams])

    return null
}

PageAnalytics.propTypes = {
    productSearchResult: PropTypes.object,
    category: PropTypes.object,
    searchQuery: PropTypes.string,
    isSearch: PropTypes.bool,
    searchParams: PropTypes.object
}

export default PageAnalytics
