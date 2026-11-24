/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {
    Box,
    Button,
    Flex,
    Heading,
    Image,
    SimpleGrid,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import Link from '@salesforce/retail-react-app/app/components/link'
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller'
import SmartSearchInput from '@salesforce/retail-react-app/app/components/commerce-agent-search/search-input'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {searchUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'
import {
    askAiButton,
    editorialFont,
    smartSearchColors as colors
} from '@salesforce/retail-react-app/app/components/commerce-agent-search/styles'

const collectionColors = ['#dbeae8', '#f5e5e0', '#e5e8f4', '#e8eddc']

const SmartSearchHome = ({storefront}) => {
    const {
        brand,
        collections,
        heroImage,
        headline = 'Find your next favorite.',
        description = 'Search for a product or describe what you need. We’ll help you find the right match.',
        prompts = []
    } = storefront
    const heroSrc = heroImage?.startsWith('static/') ? getAssetUrl(heroImage) : heroImage
    const [featured, setFeatured] = useState(collections[0])
    const navigate = useNavigation()
    const {data, isLoading} = useProductSearch({
        parameters: {
            refine: ['cgid=' + featured.id],
            expand: ['images', 'prices', 'variations'],
            allImages: true,
            limit: 4
        }
    })

    const search = (query) => navigate(searchUrlBuilder(query), 'push', {commerceAgentSearch: true})

    return (
        <Box data-testid="home-page" bg={colors.canvas} color={colors.ink}>
            <Seo title={brand} description={description} />
            <Flex
                as="section"
                position="relative"
                isolation="isolate"
                align="end"
                minH={{base: '485px', lg: 'min(69vh, 670px)'}}
                bg="#152d30"
                color="white"
                px={{base: 5, md: 12, lg: 20}}
                py={{base: 12, md: 16}}
            >
                {heroSrc && (
                    <Image
                        src={heroSrc}
                        alt=""
                        fetchPriority="high"
                        position="absolute"
                        inset={0}
                        w="full"
                        h="full"
                        objectFit="cover"
                        objectPosition="center"
                        zIndex={-2}
                    />
                )}
                <Box
                    position="absolute"
                    inset={0}
                    background="linear-gradient(90deg, #0e242bea 0%, #0e242b80 48%, #0e242b15 100%)"
                    zIndex={-1}
                />
                <Stack spacing={4} w="full" maxW="620px">
                    <Flex
                        align="center"
                        gap={2}
                        textTransform="uppercase"
                        letterSpacing=".18em"
                        fontSize="xs"
                        fontWeight="bold"
                        color="#d7ebdf"
                    >
                        <SparkleIcon boxSize={4} aria-hidden="true" />
                        AI-powered shopping
                    </Flex>
                    <Heading
                        as="h1"
                        fontFamily={editorialFont}
                        fontSize={{base: '44px', md: '60px', xl: '78px'}}
                        fontWeight="normal"
                        lineHeight={1}
                        letterSpacing="-.04em"
                    >
                        {headline}
                    </Heading>
                    <Text maxW="440px" fontSize={{base: 'sm', md: 'md'}} color="#f0f5ef">
                        {description}
                    </Text>
                    <Box mt={2}>
                        <SmartSearchInput
                            showSuggestions={false}
                            inputId="home-smart-search"
                            aria-label="What are you shopping for?"
                            placeholder="What are you shopping for?"
                            height={{base: '54px', md: '60px'}}
                        />
                    </Box>
                    <Flex gap={2} flexWrap="wrap">
                        {prompts.map((prompt) => (
                            <Button
                                key={prompt}
                                onClick={() => search(prompt)}
                                size="sm"
                                variant="outline"
                                color="white"
                                bg="blackAlpha.300"
                                borderColor="whiteAlpha.600"
                                borderRadius="full"
                                _hover={{bg: 'whiteAlpha.300'}}
                            >
                                {prompt}
                            </Button>
                        ))}
                    </Flex>
                </Stack>
            </Flex>

            <Box
                as="nav"
                aria-label="Featured collections"
                bg="white"
                borderBottom="1px solid"
                borderColor={colors.border}
                px={{base: 5, md: 12, lg: 20}}
                py={4}
            >
                <Flex gap={2} wrap="wrap" maxW="1440px" mx="auto">
                    {collections.map((collection) => (
                        <Button
                            key={collection.id}
                            size="sm"
                            variant="outline"
                            borderColor={colors.border}
                            borderRadius="full"
                            color={featured.id === collection.id ? 'white' : colors.ink}
                            bg={featured.id === collection.id ? colors.accent : 'transparent'}
                            _hover={{
                                bg: featured.id === collection.id ? colors.hover : colors.tint
                            }}
                            aria-pressed={featured.id === collection.id}
                            onClick={() => setFeatured(collection)}
                        >
                            {collection.label}
                        </Button>
                    ))}
                </Flex>
            </Box>

            <Stack
                maxW="1600px"
                mx="auto"
                spacing={{base: 10, md: 16}}
                px={{base: 5, md: 12, lg: 20}}
                py={{base: 9, md: 14}}
            >
                <Box as="section" aria-labelledby="featured-collection-title">
                    <Flex justify="space-between" align="end" gap={4} mb={5}>
                        <Heading
                            id="featured-collection-title"
                            as="h2"
                            fontFamily={editorialFont}
                            fontSize={{base: '30px', md: '40px'}}
                            fontWeight="normal"
                            lineHeight={1.1}
                        >
                            {featured.label}
                        </Heading>
                        <Link
                            to={'/category/' + featured.id}
                            color={colors.accent}
                            fontWeight="semibold"
                            whiteSpace="nowrap"
                        >
                            View all →
                        </Link>
                    </Flex>
                    {data?.hits?.length || isLoading ? (
                        <ProductScroller
                            products={data?.hits}
                            isLoading={isLoading}
                            itemWidth={{base: '55%', md: '31%', lg: 'calc(25% - 12px)'}}
                            scrollProps={{px: 0}}
                        />
                    ) : (
                        <Text color={colors.muted}>
                            Browse the collection to see the full selection.
                        </Text>
                    )}
                </Box>
                <Box as="section" aria-labelledby="shop-collections-title">
                    <Heading
                        id="shop-collections-title"
                        as="h2"
                        fontFamily={editorialFont}
                        fontSize={{base: '30px', md: '40px'}}
                        fontWeight="normal"
                        mb={5}
                    >
                        Shop by collection
                    </Heading>
                    <SimpleGrid columns={{base: 2, lg: 4}} spacing={4}>
                        {collections.slice(0, 4).map(({id, label}, index) => (
                            <Flex
                                as={Link}
                                key={id}
                                to={'/category/' + id}
                                minH={{base: 24, md: 36}}
                                align="end"
                                justify="space-between"
                                gap={1}
                                p={{base: 4, md: 6}}
                                borderRadius="16px"
                                bg={collectionColors[index]}
                                color={colors.ink}
                                _hover={{textDecoration: 'none', boxShadow: 'md'}}
                            >
                                <Text fontFamily={editorialFont} fontSize={{base: 'xl', md: '2xl'}}>
                                    {label}
                                </Text>
                                <Text as="span" aria-hidden="true">
                                    ↗
                                </Text>
                            </Flex>
                        ))}
                    </SimpleGrid>
                </Box>
                <Flex
                    as="section"
                    flexWrap="wrap"
                    align="center"
                    justify="space-between"
                    gap={6}
                    bg={colors.tint}
                    border="1px solid"
                    borderColor={colors.border}
                    borderRadius="16px"
                    p={{base: 6, md: 9}}
                >
                    <Stack spacing={2}>
                        <Heading
                            as="h2"
                            fontFamily={editorialFont}
                            fontSize={{base: '2xl', md: '4xl'}}
                            fontWeight="normal"
                        >
                            Not sure where to start?
                        </Heading>
                        <Text color={colors.muted}>
                            Get help comparing products and narrowing down your options.
                        </Text>
                    </Stack>
                    <Button
                        {...askAiButton}
                        leftIcon={<SparkleIcon boxSize={4} />}
                        onClick={openShopperAgentWidget}
                    >
                        Chat with the shopping agent
                    </Button>
                </Flex>
            </Stack>
        </Box>
    )
}

SmartSearchHome.propTypes = {
    storefront: PropTypes.shape({
        brand: PropTypes.string.isRequired,
        headline: PropTypes.string,
        description: PropTypes.string,
        heroImage: PropTypes.string,
        prompts: PropTypes.arrayOf(PropTypes.string),
        collections: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired
            })
        ).isRequired
    }).isRequired
}

export default SmartSearchHome
