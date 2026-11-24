/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
// Components
import {Box, Heading, Flex, Text, Fade} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'
import {
    editorialFont,
    smartSearchColors
} from '@salesforce/retail-react-app/app/components/commerce-agent-search/styles'

const PageHeader = ({
    category,
    productSearchResult,
    isLoading,
    searchQuery,
    smartSearch,
    ...otherProps
}) => {
    if (smartSearch) {
        const total = productSearchResult?.total
        return (
            <Box {...otherProps} data-testid="sf-product-list-breadcrumb">
                <Heading
                    as="h1"
                    fontFamily={editorialFont}
                    fontSize={{base: '30px', md: '40px'}}
                    color={smartSearchColors.ink}
                    fontWeight="normal"
                    letterSpacing="-.02em"
                    overflowWrap="anywhere"
                >
                    {searchQuery}
                </Heading>
                {!isLoading && Number.isInteger(total) && (
                    <Text color={smartSearchColors.muted} fontSize="sm" mt={1}>
                        {total} {total === 1 ? 'product' : 'products'}
                    </Text>
                )}
            </Box>
        )
    }
    return (
        <Box {...otherProps} data-testid="sf-product-list-breadcrumb">
            {/* Breadcrumb */}
            {category && <Breadcrumb categories={category.parentCategoryTree} />}
            {searchQuery && <Text>Search Results for</Text>}
            {/* Category Title */}
            <Flex>
                <Heading as="h1" size="lg" marginRight={2}>
                    {`${category?.name || searchQuery || ''}`}
                </Heading>
                <Heading as="h1" size="lg" marginRight={2}>
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
    searchQuery: PropTypes.string,
    smartSearch: PropTypes.bool
}

export default PageHeader
