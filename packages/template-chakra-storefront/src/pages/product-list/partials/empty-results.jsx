/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import {Button, Text, Flex, Stack, Link} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'
import {SearchIcon} from '../../../components/icons'
import RecommendedProducts from '../../../components/recommended-products'
import {EINSTEIN_RECOMMENDERS} from '../../../../config/constants'
import {withTranslations, defineMessages} from '../../../components/with-translations'

const messages = defineMessages({
    contactUs: {
        id: 'empty_search_results.link.contact_us',
        defaultMessage: 'Contact Us'
    },
    cantFindAnythingForCategory: {
        id: 'empty_search_results.info.cant_find_anything_for_category',
        defaultMessage: 'We couldn’t find anything for {category}. Try searching for a product or {link}.'
    },
    cantFindAnythingForQuery: {
        id: 'empty_search_results.info.cant_find_anything_for_query',
        defaultMessage: 'We couldn’t find anything for "{searchQuery}".'
    },
    doubleCheckSpelling: {
        id: 'empty_search_results.info.double_check_spelling',
        defaultMessage: 'Double-check your spelling and try again or {link}.'
    },
    topSellers: {
        id: 'empty_search_results.recommended_products.title.top_sellers',
        defaultMessage: 'Top Sellers'
    },
    mostViewed: {
        id: 'empty_search_results.recommended_products.title.most_viewed',
        defaultMessage: 'Most Viewed'
    },
    test:{
        id: 'empty_search_results.test',
        defaultMessage: 'Test123'
    }
})

const EmptySearchResults = ({searchQuery, category, messages}) => {
    return (
        <Flex
            data-testid="sf-product-empty-list-page"
            direction="column"
            alignItems="center"
            textAlign="center"
            paddingTop={28}
            paddingBottom={28}
        >
            <SearchIcon boxSize={[6, 12, 12, 12]} marginBottom={5} />
            {!searchQuery ? (
                <Text fontSize={['l', 'l', 'xl', '2xl']} fontWeight="700" marginBottom={2}>
                    {messages.cantFindAnythingForCategory({
                        category: category?.name,
                        link: (
                            <Link as={RouteLink} to={'/'}>
                                {messages.contactUs}
                            </Link>
                        )
                    })}
                </Text>
            ) : (
                <Fragment>
                    <Text fontSize={['lg', 'lg', 'xl', '3xl']} fontWeight="700" marginBottom={2}>
                        {messages.cantFindAnythingForQuery({
                            searchQuery: searchQuery
                        })}
                    </Text>
                    <Text fontSize={['md', 'md', 'md', 'md']} fontWeight="400">
                        {messages.doubleCheckSpelling({
                            link: (
                                <Button as={RouteLink} variant="link" to={'/'}>
                                    {messages.contactUs}
                                </Button>
                            )
                        })}
                    </Text>
                    <Stack gap={16} marginTop={32}>
                        <RecommendedProducts
                            title={messages.topSellers}
                            recommender={EINSTEIN_RECOMMENDERS.EMPTY_SEARCH_RESULTS_TOP_SELLERS}
                            mx={{base: -4, md: -8, lg: 0}}
                        />

                        <RecommendedProducts
                            title={messages.mostViewed}
                            recommender={EINSTEIN_RECOMMENDERS.EMPTY_SEARCH_RESULTS_MOST_VIEWED}
                            mx={{base: -4, md: -8, lg: 0}}
                        />
                    </Stack>
                </Fragment>
            )}
        </Flex>
    )
}

EmptySearchResults.propTypes = {
    searchQuery: PropTypes.string,
    category: PropTypes.object,
    messages: PropTypes.object
}

export default withTranslations(EmptySearchResults, messages)
