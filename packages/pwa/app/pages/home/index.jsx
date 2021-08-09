/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {Box, Button, Grid, GridItem, SimpleGrid, Stack} from '@chakra-ui/react'
import {getAssetUrl} from 'pwa-kit-react-sdk/dist/ssr/universal/utils'
import {Link} from 'react-router-dom'

import useBasket from '../../commerce-api/hooks/useBasket'

import Hero from '../../components/hero'
import Seo from '../../components/seo'
import Section from '../../components/section'
import BasicTile from '../../components/basic-tile'
import ProductTile from '../../components/product-tile'
import {BasketIcon} from '../../components/icons'

import {categories} from './data'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = (props) => {
    const intl = useIntl()
    const {productSearchResult} = props
    const basket = useBasket()
    const handleAddToCart = async (itemId, price) => {
        const item = {
            productId: itemId,
            price: price,
            quantity: 1
        }
        if (basket.basketId) {
            basket.addItemToBasket([item])
        }
    }
    const recommendedProducts = productSearchResult?.hits
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
            {recommendedProducts && recommendedProducts.length && (
                <Section
                    title={intl.formatMessage({
                        defaultMessage: 'New Arrivals'
                    })}
                >
                    <SimpleGrid columns={{base: 1, md: 3}} spacing={4}>
                        {recommendedProducts.map((product) => {
                            return (
                                <Stack
                                    key={product.productId}
                                    direction="column"
                                    spacing={2}
                                    width="full"
                                    justifyContent="space-between"
                                >
                                    <ProductTile productSearchItem={product} />
                                    <Button
                                        leftIcon={<BasketIcon />}
                                        variant="outline"
                                        onClick={() => {
                                            let productId = product.productId
                                            if (product?.productType?.master) {
                                                productId = product.representedProduct.id
                                            }
                                            const price = product.price

                                            handleAddToCart(productId, price)
                                        }}
                                    >
                                        <FormattedMessage defaultMessage="Add to cart" />
                                    </Button>
                                </Stack>
                            )
                        })}
                    </SimpleGrid>
                </Section>
            )}
        </Box>
    )
}

Home.getTemplateName = () => 'home'
Home.propTypes = {
    /**
     * The search result object showing all the recommended products
     */
    productSearchResult: PropTypes.object
}

Home.getProps = async ({api}) => {
    const recommededCategoryId = 'womens-clothing-tops'

    const [productSearchResult] = await Promise.all([
        api.shopperSearch.productSearch({
            parameters: {
                refine: `cgid=${recommededCategoryId}`,
                limit: 3,
                offset: 0,
                sort: 'best-matches'
            }
        })
    ])

    return {productSearchResult}
}

export default Home
