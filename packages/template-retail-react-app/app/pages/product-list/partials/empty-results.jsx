/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import {
    Button,
    Text,
    Flex,
    Stack,
    Link
} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {SearchIcon} from '@salesforce/retail-react-app/app/components/icons'
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import {EINSTEIN_RECOMMENDERS} from '@salesforce/retail-react-app/app/constants'

const contactUsMessage = defineMessage({
    id: 'empty_search_results.link.contact_us',
    defaultMessage: 'Contact Us'
})

const EmptySearchResults = ({searchQuery, category}) => {
    const intl = useIntl()
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
                <Fragment>
                    {' '}
                    <Text fontSize={['l', 'l', 'xl', '2xl']} fontWeight="700" marginBottom={2}>
                        {intl.formatMessage(
                            {
                                id: 'empty_search_results.info.cant_find_anything_for_category',
                                defaultMessage:
                                    'We couldn’t find anything for {category}. Try searching for a product or {link}.'
                            },
                            {
                                category: category.name,
                                link: (
                                    <Link as={RouteLink} to={'/'}>
                                        {intl.formatMessage(contactUsMessage)}
                                    </Link>
                                )
                            }
                        )}
                    </Text>{' '}
                </Fragment>
            ) : (
                <Fragment>
                    <Text fontSize={['lg', 'lg', 'xl', '3xl']} fontWeight="700" marginBottom={2}>
                        {intl.formatMessage(
                            {
                                id: 'empty_search_results.info.cant_find_anything_for_query',
                                defaultMessage: 'We couldn’t find anything for "{searchQuery}".'
                            },
                            {
                                searchQuery: searchQuery
                            }
                        )}
                    </Text>
                    <Text fontSize={['md', 'md', 'md', 'md']} fontWeight="400">
                        {intl.formatMessage(
                            {
                                id: 'empty_search_results.info.double_check_spelling',
                                defaultMessage:
                                    'Double-check your spelling and try again or {link}.'
                            },
                            {
                                link: (
                                    <Button variant="link" to={'/'}>
                                        {intl.formatMessage(contactUsMessage)}
                                    </Button>
                                )
                            }
                        )}
                    </Text>
                    <Stack spacing={16} marginTop={32}>
                        <RecommendedProducts
                            title={
                                <FormattedMessage
                                    defaultMessage="Top Sellers"
                                    id="empty_search_results.recommended_products.title.top_sellers"
                                />
                            }
                            recommender={EINSTEIN_RECOMMENDERS.EMPTY_SEARCH_RESULTS_TOP_SELLERS}
                            mx={{base: -4, md: -8, lg: 0}}
                        />

                        <RecommendedProducts
                            title={
                                <FormattedMessage
                                    defaultMessage="Most Viewed"
                                    id="empty_search_results.recommended_products.title.most_viewed"
                                />
                            }
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
    category: PropTypes.object
}

export default EmptySearchResults
