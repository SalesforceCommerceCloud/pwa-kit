/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import {useLocation} from 'react-router-dom'

// Components
import {Box, Button, Stack, Link} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Hero from '@salesforce/retail-react-app/app/components/hero'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import Section from '@salesforce/retail-react-app/app/components/section'
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller'

// Others
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'

//Hooks
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'

// Constants
import {
    CUSTOM_HOME_TITLE,
    HOME_SHOP_PRODUCTS_CATEGORY_ID,
    HOME_SHOP_PRODUCTS_LIMIT,
    MAX_CACHE_AGE,
    STALE_WHILE_REVALIDATE
} from '../../constants'

import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = () => {
    const intl = useIntl()
    const einstein = useEinstein()
    const {pathname} = useLocation()

    // useServerContext is a special hook introduced in v3 PWA Kit SDK.
    // It replaces the legacy `getProps` and provide a react hook interface for SSR.
    // it returns the request and response objects on the server side,
    // and these objects are undefined on the client side.
    const {res} = useServerContext()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate={STALE_WHILE_REVALIDATE}`
        )
    }

    const {data: productSearchResult, isLoading} = useProductSearch({
        parameters: {
            refine: [`cgid=${HOME_SHOP_PRODUCTS_CATEGORY_ID}`, 'htype=master'],
            expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
            perPricebook: true,
            allVariationProperties: true,
            limit: HOME_SHOP_PRODUCTS_LIMIT
        }
    })

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
    }, [])

    return (
        <Box data-testid="home-page" layerStyle="page">
            <Seo
                title="Home Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

            <Hero
                title={CUSTOM_HOME_TITLE}
                img={{
                    src: getAssetUrl('static/img/hero.png'),
                    alt: 'npx pwa-kit-create-app'
                }}
                actions={
                    <Stack spacing={{base: 4, sm: 6}} direction={{base: 'column', sm: 'row'}}>
                        <Button
                            as={Link}
                            href="https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html"
                            target="_blank"
                            width={{base: 'full', md: 'inherit'}}
                            paddingX={7}
                            _hover={{textDecoration: 'none'}}
                        >
                            <FormattedMessage
                                defaultMessage="Get started"
                                id="home.link.get_started"
                            />
                        </Button>
                    </Stack>
                }
            />

            {productSearchResult && (
                <Section
                    padding={4}
                    paddingTop={16}
                    title={intl.formatMessage({
                        defaultMessage: 'Shop Products',
                        id: 'home.heading.shop_products'
                    })}
                    subtitle={intl.formatMessage(
                        {
                            defaultMessage:
                                'This section contains content from the catalog. {docLink} on how to replace it.',
                            id: 'home.description.shop_products',
                            description:
                                '{docLink} is a html button that links the user to https://sfdc.co/business-manager-manage-catalogs'
                        },
                        {
                            docLink: (
                                <Link
                                    target="_blank"
                                    href={'https://sfdc.co/business-manager-manage-catalogs'}
                                    textDecoration={'none'}
                                    position={'relative'}
                                    _after={{
                                        position: 'absolute',
                                        content: `""`,
                                        height: '2px',
                                        bottom: '-2px',
                                        margin: '0 auto',
                                        left: 0,
                                        right: 0,
                                        background: 'gray.700'
                                    }}
                                    _hover={{textDecoration: 'none'}}
                                >
                                    {intl.formatMessage({
                                        defaultMessage: 'Read docs',
                                        id: 'home.link.read_docs'
                                    })}
                                </Link>
                            )
                        }
                    )}
                >
                    <Stack pt={8} spacing={16}>
                        <ProductScroller
                            products={productSearchResult?.hits}
                            isLoading={isLoading}
                        />
                    </Stack>
                </Section>
            )}
        </Box>
    )
}

Home.getTemplateName = () => 'home'

export default Home
