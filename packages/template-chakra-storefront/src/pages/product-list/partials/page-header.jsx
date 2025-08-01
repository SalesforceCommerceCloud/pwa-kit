/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
// Components
import {Box, Heading, Flex, Text, Fade} from '@chakra-ui/react'

// Project Components
import Breadcrumb from '../../../components/breadcrumb'

const PageHeader = ({category, productSearchResult, isLoading, searchQuery, ...otherProps}) => {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            searchResultsFor: formatMessage({
                id: 'page_header.search_results_for',
                defaultMessage: 'Search Results for'
            })
        }),
        [intl]
    )

    return (
        <Box {...otherProps} data-testid="sf-product-list-breadcrumb">
            {/* Breadcrumb */}
            {category && <Breadcrumb categories={category.parentCategoryTree} />}
            {searchQuery && <Text>{messages.searchResultsFor}</Text>}
            {/* Category Title */}
            <Flex>
                <Heading as="h2" size="lg" marginRight={2}>
                    {`${category?.name || searchQuery || ''}`}
                </Heading>
                <Heading as="h2" size="lg" marginRight={2}>
                    {!isLoading && <Fade in={true}>({productSearchResult?.total})</Fade>}
                </Heading>
            </Flex>
        </Box>
    )
}

PageHeader.propTypes = {
    category: PropTypes.object,
    productSearchResult: PropTypes.object,
    isLoading: PropTypes.bool,
    searchQuery: PropTypes.string
}

export default PageHeader
