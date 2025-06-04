/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import {RouteProps} from 'react-router-dom'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'
import {applyHOCs} from '@salesforce/pwa-kit-extension-sdk/react/utils'
import {BeforeRouteMatchParams, GetRoutesParams} from '@salesforce/pwa-kit-extension-sdk/types'

// Local Imports
import {Config} from './types'
import {configureRoutes} from './utils/routes-utils'
import {withChakraUI} from './components/with-chakra-ui'
import {withCommerceSdkReact} from './components/with-commerce-sdk-react'
import {withCurrency} from './components/with-currency'
import {withLayout} from './components/with-layout'
import {withMultiSite} from './components/with-multi-site'
import {withReactIntl} from './components/with-react-intl'
import {withStorefrontPreview} from './components/with-storefront-preview'
import extensionMeta from '../extension-meta.json'

// Pages
import * as Pages from './pages'

//TODO: THIS CODE IS FOR TESTING ONLY
import Pagination from './components/pagination'
import SwatchGroup from './components/swatch-group'
import Swatch from './components/swatch-group/swatch'

class ChakraStorefront extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        // NOTE: The order of these HOCs is important!
        const requiredHOCs = [
            withLayout,
            withChakraUI,
            withCurrency,
            withReactIntl,
            withMultiSite,
            withStorefrontPreview,
            withCommerceSdkReact
        ]

        return applyHOCs(App, requiredHOCs)
    }

    getRoutes(params: GetRoutesParams): RouteProps[] {
        const config = this.getConfig()

        const extensionRoutes = [
            {
                path: config.pages.Home && config.pages.Home.path,
                component: Pages.Home,
                exact: true
            },
            //TODO: THIS CODE IS FOR TESTING ONLY
            {
                path: '/pagination-test',
                component: () => {
                    // Sample URLs for testing pagination
                    const sampleUrls = [
                        '/products?page=1',
                        '/products?page=2',
                        '/products?page=3',
                        '/products?page=4',
                        '/products?page=5',
                        '/products?page=6',
                        '/products?page=7',
                        '/products?page=8',
                        '/products?page=9',
                        '/products?page=10'
                    ]

                    return (
                        <div style={{padding: '32px', maxWidth: '1200px', margin: '0 auto'}}>
                            <h1 style={{fontSize: '2rem', marginBottom: '24px'}}>
                                Pagination Component Examples
                            </h1>

                            <div style={{marginBottom: '32px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    First Page (Page 1 of 10)
                                </h2>
                                <Pagination urls={sampleUrls} currentURL="/products?page=1" />
                            </div>

                            <div style={{marginBottom: '32px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Middle Page (Page 5 of 10)
                                </h2>
                                <Pagination urls={sampleUrls} currentURL="/products?page=5" />
                            </div>

                            <div style={{marginBottom: '32px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Last Page (Page 10 of 10)
                                </h2>
                                <Pagination urls={sampleUrls} currentURL="/products?page=10" />
                            </div>

                            <div style={{marginBottom: '32px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Single Page (1 of 1)
                                </h2>
                                <Pagination
                                    urls={['/products?page=1']}
                                    currentURL="/products?page=1"
                                />
                            </div>

                            <div style={{marginBottom: '32px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Three Pages (Page 2 of 3)
                                </h2>
                                <Pagination
                                    urls={[
                                        '/products?page=1',
                                        '/products?page=2',
                                        '/products?page=3'
                                    ]}
                                    currentURL="/products?page=2"
                                />
                            </div>
                        </div>
                    )
                },
                exact: true
            },
            {
                path: '/swatch-group-test',
                component: () => {
                    const [selectedColor, setSelectedColor] = React.useState('red')
                    const [selectedSize, setSelectedSize] = React.useState('M')

                    // Color swatch data for circle variant
                    const colorSwatches = [
                        {value: 'red', name: 'Red', color: '#FF0000'},
                        {value: 'blue', name: 'Blue', color: '#0000FF'},
                        {value: 'green', name: 'Green', color: '#00FF00'},
                        {value: 'black', name: 'Black', color: '#000000'},
                        {value: 'white', name: 'White', color: '#FFFFFF'}
                    ]

                    // Size swatch data for square variant
                    const sizeSwatches = [
                        {value: 'XS', name: 'Extra Small'},
                        {value: 'S', name: 'Small'},
                        {value: 'M', name: 'Medium'},
                        {value: 'L', name: 'Large'},
                        {value: 'XL', name: 'Extra Large'}
                    ]

                    return (
                        <div style={{padding: '32px', maxWidth: '1200px', margin: '0 auto'}}>
                            <h1 style={{fontSize: '2rem', marginBottom: '24px'}}>
                                SwatchGroup Component Examples
                            </h1>

                            <div style={{marginBottom: '40px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Color Swatches (Circle Variant)
                                </h2>
                                <p style={{marginBottom: '16px', color: '#666'}}>
                                    Selected:{' '}
                                    {colorSwatches.find((c) => c.value === selectedColor)?.name}
                                </p>
                                <SwatchGroup
                                    label="Color"
                                    value={selectedColor}
                                    handleChange={setSelectedColor}
                                    displayName={
                                        colorSwatches.find((c) => c.value === selectedColor)?.name
                                    }
                                >
                                    {colorSwatches.map((color) => (
                                        <Swatch
                                            key={color.value}
                                            value={color.value}
                                            name={color.name}
                                            variant="circle"
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: color.color,
                                                    border:
                                                        color.value === 'white'
                                                            ? '1px solid #ccc'
                                                            : 'none',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Swatch>
                                    ))}
                                </SwatchGroup>
                            </div>

                            <div style={{marginBottom: '40px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Size Swatches (Square Variant)
                                </h2>
                                <p style={{marginBottom: '16px', color: '#666'}}>
                                    Selected:{' '}
                                    {sizeSwatches.find((s) => s.value === selectedSize)?.name}
                                </p>
                                <SwatchGroup
                                    label="Size"
                                    value={selectedSize}
                                    handleChange={setSelectedSize}
                                    displayName={
                                        sizeSwatches.find((s) => s.value === selectedSize)?.name
                                    }
                                >
                                    {sizeSwatches.map((size) => (
                                        <Swatch
                                            key={size.value}
                                            value={size.value}
                                            name={size.name}
                                            variant="square"
                                        >
                                            {size.value}
                                        </Swatch>
                                    ))}
                                </SwatchGroup>
                            </div>

                            <div style={{marginBottom: '40px'}}>
                                <h2 style={{fontSize: '1.5rem', marginBottom: '16px'}}>
                                    Mixed State Examples
                                </h2>
                                <div style={{marginBottom: '24px'}}>
                                    <h3 style={{fontSize: '1.2rem', marginBottom: '12px'}}>
                                        Colors with Disabled State
                                    </h3>
                                    <SwatchGroup
                                        label="Color"
                                        value="available-red"
                                        handleChange={() => {}}
                                    >
                                        <Swatch
                                            value="available-red"
                                            name="Available Red"
                                            variant="circle"
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#FF0000',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Swatch>
                                        <Swatch
                                            value="disabled-blue"
                                            name="Disabled Blue"
                                            variant="circle"
                                            disabled
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#0000FF',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Swatch>
                                        <Swatch
                                            value="available-green"
                                            name="Available Green"
                                            variant="circle"
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#00FF00',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Swatch>
                                    </SwatchGroup>
                                </div>

                                <div style={{marginBottom: '24px'}}>
                                    <h3 style={{fontSize: '1.2rem', marginBottom: '12px'}}>
                                        Single Option
                                    </h3>
                                    <SwatchGroup
                                        label="Size"
                                        value="only-option"
                                        handleChange={() => {}}
                                    >
                                        <Swatch
                                            value="only-option"
                                            name="Only Available Size"
                                            variant="square"
                                        >
                                            L
                                        </Swatch>
                                    </SwatchGroup>
                                </div>

                                <div style={{marginBottom: '24px'}}>
                                    <h3 style={{fontSize: '1.2rem', marginBottom: '12px'}}>
                                        No Label Example
                                    </h3>
                                    <SwatchGroup value="no-label" handleChange={() => {}}>
                                        <Swatch value="no-label" name="Red" variant="circle">
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#FF0000',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Swatch>
                                        <Swatch value="blue" name="Blue" variant="circle">
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#0000FF',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        </Swatch>
                                    </SwatchGroup>
                                </div>
                            </div>
                        </div>
                    )
                },
                exact: true
            }
        ].filter((route) => route.path !== false)

        return extensionRoutes as RouteProps[]
    }

    // Called before the route with all the routes
    beforeRouteMatch({allRoutes}: BeforeRouteMatchParams): RouteProps[] {
        const config = this.getConfig()

        return configureRoutes(allRoutes, config, {
            ignoredRoutes: ['/callback']
        })
    }
}

export default ChakraStorefront
