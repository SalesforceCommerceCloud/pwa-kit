/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {Fragment} from 'react'
import {Button, Text, Flex, Stack, Link} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'
import {FormattedMessage, useIntl} from 'react-intl'
import {SearchIcon} from '../../../components/icons'
import RecommendedProducts from '../../../components/recommended-products'

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
                                id: 'product_list_page.no_results',
                                defaultMessage:
                                    'We couldn’t find anything for {category}. Try searching for a product or {link}.'
                            },
                            {
                                category: category.name,
                                link: (
                                    <Link as={RouteLink} to={'/'}>
                                        {intl.formatMessage({
                                            id: 'product_list_page.no_results.contact_us',
                                            defaultMessage: 'contact us'
                                        })}
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
                                id: 'product_list_page.no_results_search_query',

                                defaultMessage: 'We couldn’t find anything for "{searchQuery}"'
                            },
                            {
                                searchQuery: searchQuery
                            }
                        )}
                    </Text>
                    <Text fontSize={['md', 'md', 'md', 'md']} fontWeight="400">
                        {intl.formatMessage(
                            {
                                id: 'product_list_page.no_results_double_check',
                                defaultMessage: 'Double-check your spelling and try again or {link}'
                            },
                            {
                                link: (
                                    <Button variant="link" to={'/'}>
                                        {intl.formatMessage({
                                            id: 'product_list_page.no_results.contact_us',
                                            defaultMessage: 'contact us'
                                        })}
                                    </Button>
                                )
                            }
                        )}
                    </Text>
                    <Stack spacing={16} marginTop={32}>
                        <RecommendedProducts
                            title={<FormattedMessage defaultMessage="Top Sellers" />}
                            recommender={'home-top-revenue-for-category'}
                            mx={{base: -4, md: -8, lg: 0}}
                        />

                        <RecommendedProducts
                            title={<FormattedMessage defaultMessage="Most Viewed" />}
                            recommender={'products-in-all-categories'}
                            mx={{base: -4, md: -8, lg: 0}}
                        />

                        <RecommendedProducts
                            title={<FormattedMessage defaultMessage="Most Viewed" />}
                            recommender={'products-in-all-categories'}
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
