/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'

// Components
import {
    Box,
    Button,
    SimpleGrid,
    HStack,
    VStack,
    Text,
    Flex,
    Stack,
    Container,
    Link
} from '@chakra-ui/react'

// Project Components
import Hero from '../../components/hero'
import Seo from '../../components/seo'
import Section from '../../components/section'
import ProductScroller from '../../components/product-scroller'

// Others
import {getStaticAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {heroFeatures, features} from './data'

//Hooks

// Constants
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * This is the home page for Chakra Storefront.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = () => {
    const intl = useIntl()
    const {
        pages: {
            home: {productLimit: HOME_PRODUCT_LIMIT, mainCategory: HOME_MAIN_CATEGORY}
        },
        maxCacheAge: MAX_CACHE_AGE,
        staleWhileRevalidate: STALE_WHILE_REVALIDATE
    } = getConfig()
    const {res} = useServerContext()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
        )
    }

    const {data: productSearchResult, isLoading} = useProductSearch({
        parameters: {
            allImages: true,
            allVariationProperties: true,
            expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
            limit: HOME_PRODUCT_LIMIT,
            perPricebook: true,
            refine: [`cgid=${HOME_MAIN_CATEGORY}`, 'htype=master']
        }
    })

    const messages = {
        heroTitle: intl.formatMessage({
            id: 'home.title.react_starter_store',
            defaultMessage: 'The React PWA Starter Store for Retail'
        }),
        getStarted: intl.formatMessage({
            id: 'home.link.get_started',
            defaultMessage: 'Get started'
        }),
        shopProducts: {
            title: intl.formatMessage({
                id: 'home.heading.shop_products',
                defaultMessage: 'Shop Products'
            }),
            subtitle: intl.formatMessage(
                {
                    id: 'home.description.shop_products',
                    defaultMessage: 'This section contains content from the catalog. {docLink} on how to replace it.',
                    description: '{docLink} is a html button that links the user to https://sfdc.co/business-manager-manage-catalogs'
                },
                {
                    docLink: (
                        <Link
                            target="_blank"
                            href={'https://sfdc.co/business-manager-manage-catalogs'}
                            textDecoration={'none'}
                            position={'relative'}
                            css={{
                                '&::after': {
                                    position: 'absolute',
                                    content: '""',
                                    height: '2px',
                                    bottom: '-2px',
                                    margin: '0 auto',
                                    left: 0,
                                    right: 0,
                                    background: 'gray.700'
                                }
                            }}
                            _hover={{textDecoration: 'none'}}
                        >
                            {intl.formatMessage({
                                id: 'home.link.read_docs',
                                defaultMessage: 'Read docs'
                            })}
                        </Link>
                    )
                }
            )
        },
        features: {
            title: intl.formatMessage({
                id: 'home.heading.features',
                defaultMessage: 'Features'
            }),
            subtitle: intl.formatMessage({
                id: 'home.description.features',
                defaultMessage: 'Out-of-the-box features so that you focus only on adding enhancements.'
            })
        },
        help: {
            title: intl.formatMessage({
                id: 'home.heading.here_to_help',
                defaultMessage: "We're here to help"
            }),
            description: intl.formatMessage({
                id: 'home.description.here_to_help',
                defaultMessage: 'Contact our support staff.'
            }),
            descriptionLine2: intl.formatMessage({
                id: 'home.description.here_to_help_line_2',
                defaultMessage: 'They will get you to the right place.'
            }),
            contactUs: intl.formatMessage({
                id: 'home.link.contact_us',
                defaultMessage: 'Contact Us'
            })
        }
    }

    return (
        <Box data-testid="home-page" layerStyle="page">
            <Seo
                title="Home Page"
                description="Commerce Cloud Chakra Storefront"
                keywords="Commerce Cloud, Chakra Storefront, React Storefront"
            />

            <Hero
                title={messages.heroTitle}
                img={{
                    src: getStaticAssetUrl('img/hero.png', {
                        appExtensionPackageName: '@salesforce/template-chakra-storefront'
                    }),
                    alt: 'npx pwa-kit-create-app'
                }}
                actions={
                    <Stack gap={{base: 4, sm: 6}} direction={{base: 'column', sm: 'row'}}>
                        <Button
                            as={Link}
                            href="https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html"
                            target="_blank"
                            width={{base: 'full', md: 'inherit'}}
                            paddingX={7}
                            _hover={{textDecoration: 'none'}}
                            fontSize={{base: 'sm', md: 'md'}}
                            fontWeight={{base: 'medium', md: 'semibold'}}
                        >
                            {messages.getStarted}
                        </Button>
                    </Stack>
                }
            />

            <Section
                bg="gray.50"
                marginX="auto"
                paddingY={{base: 8, md: 16}}
                paddingX={{base: 4, md: 8}}
                borderRadius="base"
                width={{base: '100vw', md: 'inherit'}}
                position={{base: 'relative', md: 'inherit'}}
                left={{base: '50%', md: 'inherit'}}
                right={{base: '50%', md: 'inherit'}}
                marginLeft={{base: '-50vw', md: 'auto'}}
                marginRight={{base: '-50vw', md: 'auto'}}
            >
                <SimpleGrid
                    columns={{base: 1, md: 1, lg: 3}}
                    columnGap={{base: 1, md: 4}}
                    rowGap={{base: 4, md: 14}}
                >
                    {heroFeatures.map((feature, index) => {
                        const featureMessage = feature.message
                        return (
                            <Link key={index} target="_blank" href={feature.href}>
                                <Box
                                    bg="white"
                                    boxShadow="0px 2px 2px rgba(0, 0, 0, 0.1)"
                                    borderRadius="4px"
                                    w="full"
                                >
                                    <HStack>
                                        <Flex
                                            paddingLeft={6}
                                            height={24}
                                            align="center"
                                            justify="center"
                                        >
                                            {feature.icon}
                                        </Flex>
                                        <Text fontWeight="700">
                                            {intl.formatMessage(featureMessage.title)}
                                        </Text>
                                    </HStack>
                                </Box>
                            </Link>
                        )
                    })}
                </SimpleGrid>
            </Section>

            {productSearchResult && (
                <Section
                    padding={4}
                    paddingTop={16}
                    title={messages.shopProducts.title}
                    subtitle={messages.shopProducts.subtitle}
                >
                    <Stack pt={8} gap={16}>
                        <ProductScroller
                            products={productSearchResult?.hits}
                            isLoading={isLoading}
                        />
                    </Stack>
                </Section>
            )}

            <Section
                padding={4}
                paddingTop={32}
                title={messages.features.title}
                subtitle={messages.features.subtitle}
            >
                <Container maxW="6xl" marginTop={10}>
                    <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={10}>
                        {features.map((feature, index) => {
                            const featureMessage = feature.message
                            return (
                                <HStack key={index} align="top">
                                    <VStack align="start">
                                        <Flex
                                            width={16}
                                            height={16}
                                            align="center"
                                            justify="left"
                                            color="gray.900"
                                        >
                                            {feature.icon}
                                        </Flex>
                                        <Text as="h3" color="black" fontWeight="700" fontSize="xl">
                                            {intl.formatMessage(featureMessage.title)}
                                        </Text>
                                        <Text color="black">
                                            {intl.formatMessage(featureMessage.text)}
                                        </Text>
                                    </VStack>
                                </HStack>
                            )
                        })}
                    </SimpleGrid>
                </Container>
            </Section>

            <Section
                padding={4}
                paddingTop={32}
                title={messages.help.title}
                subtitle={
                    <>
                        <>{messages.help.description}</>
                        <br />
                        <>{messages.help.descriptionLine2}</>
                    </>
                }
                actions={
                    <Button
                        as={Link}
                        href="https://help.salesforce.com/s/?language=en_US"
                        target="_blank"
                        width="auto"
                        paddingX={7}
                        fontSize={{base: 'sm', md: 'md'}}
                        fontWeight={{base: 'medium', md: 'semibold'}}
                        _hover={{textDecoration: 'none'}}
                    >
                        {messages.help.contactUs}
                    </Button>
                }
                maxWidth="xl"
            />
        </Box>
    )
}

Home.getTemplateName = () => 'home'

export default Home
