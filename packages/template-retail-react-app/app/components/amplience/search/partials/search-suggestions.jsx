import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Box, Divider, Flex, Heading} from '@chakra-ui/react'
import RecentSearches from './recent-searches'
import Suggestions from './suggestions'
import ProductSuggestions from './product-suggestions'
import {useIntl} from 'react-intl'

const SearchSuggestions = ({recentSearches, searchSuggestions, closeAndNavigate}) => {
    const intl = useIntl()
    const useSuggestions =
        searchSuggestions &&
        (searchSuggestions?.categorySuggestions?.length ||
            searchSuggestions?.pageSuggestions?.length)

    return (
        <Flex w={'100%'} wrap={'wrap'}>
            <Box p={4} w={'100%'} sx={{paddingBottom: 0}}>
                <Heading as="h2" fontSize={'lg'} textTransform={'uppercase'}>
                    {intl.formatMessage({
                        id: 'amplience.search.suggestions.suggestions',
                        defaultMessage: 'Suggestions'
                    })}
                </Heading>
                <Divider sx={{paddingTop: '10px'}} />
            </Box>
            <Box p={4} w={{sm: '100%', lg: '300px'}}>
                {useSuggestions ? (
                    <Fragment>
                        {searchSuggestions?.phraseSuggestions && (
                            <>
                                <Heading
                                    sx={{paddingBottom: '8px'}}
                                    as="h2"
                                    fontSize={'md'}
                                    textTransform={'uppercase'}
                                >
                                    {intl.formatMessage({
                                        id: 'amplience.search.suggestions.searches',
                                        defaultMessage: 'Searches'
                                    })}
                                </Heading>
                            </>
                        )}
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.phraseSuggestions}
                        />
                        {searchSuggestions?.categorySuggestions && (
                            <>
                                <Heading
                                    sx={{paddingTop: '24px', paddingBottom: '6px'}}
                                    as="h2"
                                    fontSize={'md'}
                                    textTransform={'uppercase'}
                                >
                                    {intl.formatMessage({
                                        id: 'amplience.search.suggestions.categories',
                                        defaultMessage: 'Categories'
                                    })}
                                </Heading>
                            </>
                        )}
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.categorySuggestions}
                        />
                        {searchSuggestions?.pageSuggestions?.length > 0 && (
                            <>
                                <Heading
                                    sx={{
                                        paddingTop: searchSuggestions?.categorySuggestions
                                            ? '24px'
                                            : '0px',
                                        paddingBottom: '6px'
                                    }}
                                    as="h2"
                                    fontSize={'md'}
                                    textTransform={'uppercase'}
                                >
                                    {intl.formatMessage({
                                        id: 'amplience.search.suggestions.pages',
                                        defaultMessage: 'Pages'
                                    })}
                                </Heading>
                            </>
                        )}
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.pageSuggestions}
                        />
                    </Fragment>
                ) : (
                    <RecentSearches
                        recentSearches={recentSearches}
                        closeAndNavigate={closeAndNavigate}
                    />
                )}
            </Box>
            <Box p={4} w={{sm: '100%', lg: '470px'}}>
                {searchSuggestions?.productSuggestions && (
                    <Heading
                        sx={{marginBottom: '8px'}}
                        as="h2"
                        mb={4}
                        fontSize={'md'}
                        textTransform={'uppercase'}
                    >
                        {intl.formatMessage({
                            id: 'amplience.search.suggestions.products',
                            defaultMessage: 'Products'
                        })}
                    </Heading>
                )}
                <ProductSuggestions
                    closeAndNavigate={closeAndNavigate}
                    suggestions={searchSuggestions?.productSuggestions}
                />
            </Box>
        </Flex>
    )
}

SearchSuggestions.propTypes = {
    recentSearches: PropTypes.array,
    searchSuggestions: PropTypes.object,
    closeAndNavigate: PropTypes.func
}

export default SearchSuggestions
