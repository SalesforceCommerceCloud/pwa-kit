/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {Box, Button, Grid, GridItem, Stack} from '@chakra-ui/react'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'
import {Link} from 'react-router-dom'
import Hero from '../../components/hero'
import Seo from '../../components/seo'
import Section from '../../components/section'
import BasicTile from '../../components/basic-tile'
import {categoriesThreeColumns, categoriesTwoColumns} from './data'
import RecommendedProducts from '../../components/recommended-products'
import {useSiteAlias} from '../../hooks/use-site-alias'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = () => {
    const intl = useIntl()

    const siteAlias = useSiteAlias()

    return (
        <Box data-testid="home-page" layerStyle="page">
            <Seo
                title="Home Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

            <Hero
                title={intl.formatMessage({
                    defaultMessage: 'Lighter layers for lighter days.'
                })}
                img={{
                    src: getAssetUrl('static/img/hero.png'),
                    alt: intl.formatMessage({
                        defaultMessage: 'New Arrivals'
                    })
                }}
                actions={
                    <Button
                        as={Link}
                        to={`/${siteAlias}/${intl.locale}/category/newarrivals`}
                        width={{base: 'full', md: 'inherit'}}
                    >
                        <FormattedMessage defaultMessage="Shop New Arrivals" />
                    </Button>
                }
                label={intl.formatMessage({
                    defaultMessage: 'New In'
                })}
                marginBottom="16"
            />
            <Section
                title={intl.formatMessage({
                    defaultMessage: 'Shop by Category'
                })}
            >
                <Grid
                    templateRows={{base: 'repeat(1, 1fr)', md: 'repeat(auto, 1fr)'}}
                    templateColumns={{base: 'repeat(1, 1fr)', md: 'repeat(6, 1fr)'}}
                    columnGap={6}
                    rowGap={8}
                >
                    {categoriesThreeColumns.map((item, index) => {
                        const category = item.message
                        return (
                            <GridItem key={index} rowSpan={1} colSpan={{base: 1, md: 2}}>
                                <BasicTile
                                    title={intl.formatMessage(category.title)}
                                    href={intl.formatMessage(category.href, {
                                        activeLocale: intl.locale
                                    })}
                                    img={{
                                        src: getAssetUrl(intl.formatMessage(category.imgSrc)),
                                        alt: intl.formatMessage(category.imgAlt)
                                    }}
                                />
                            </GridItem>
                        )
                    })}

                    {categoriesTwoColumns.map((item, index) => {
                        const category = item.message
                        return (
                            <GridItem key={index} rowSpan={1} colSpan={{base: 1, md: 3}}>
                                <BasicTile
                                    title={intl.formatMessage(category.title)}
                                    href={intl.formatMessage(category.href, {
                                        activeLocale: intl.locale
                                    })}
                                    img={{
                                        src: getAssetUrl(intl.formatMessage(category.imgSrc)),
                                        alt: intl.formatMessage(category.imgAlt)
                                    }}
                                />
                            </GridItem>
                        )
                    })}
                </Grid>
            </Section>

            <Stack spacing={16}>
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
            </Stack>
        </Box>
    )
}

Home.getTemplateName = () => 'home'
Home.propTypes = {
    recommendations: PropTypes.array,
    isLoading: PropTypes.bool
}

Home.getProps = async ({res}) => {
    // Since the home page is static, it is safe to set max age to a high value
    // we set it to a year here, but you can set the value that is suitable for your project
    if (res) {
        res.set('Cache-Control', 'max-age=31536000')
    }
}

export default Home
