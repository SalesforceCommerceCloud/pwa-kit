/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {Box, Button, Grid, GridItem, Stack} from '@chakra-ui/react'
import {getAssetUrl} from 'pwa-kit-react-sdk/dist/ssr/universal/utils'
import {Link} from 'react-router-dom'
import Hero from '../../components/hero'
import Seo from '../../components/seo'
import Section from '../../components/section'
import BasicTile from '../../components/basic-tile'
import {categories} from './data'
import RecommendedProducts from '../../components/recommended-products'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = () => {
    const intl = useIntl()

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
                        to="/en/category/newarrivals"
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
                    <GridItem rowSpan={1} colSpan={{base: 1, md: 2}}>
                        <BasicTile {...categories[0]} />
                    </GridItem>
                    <GridItem rowSpan={1} colSpan={{base: 1, md: 2}}>
                        <BasicTile {...categories[1]} />
                    </GridItem>
                    <GridItem rowSpan={1} colSpan={{base: 1, md: 2}}>
                        <BasicTile {...categories[2]} />
                    </GridItem>
                    <GridItem rowSpan={1} colSpan={{base: 1, md: 3}}>
                        <BasicTile {...categories[3]} />
                    </GridItem>
                    <GridItem rowSpan={1} colSpan={{base: 1, md: 3}}>
                        <BasicTile {...categories[4]} />
                    </GridItem>
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

Home.getProps = async () => {}

export default Home
