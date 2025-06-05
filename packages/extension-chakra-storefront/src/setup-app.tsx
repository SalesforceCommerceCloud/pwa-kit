/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React, {useState} from 'react'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'
import {applyHOCs} from '@salesforce/pwa-kit-extension-sdk/react/utils'
import {
    BeforeRouteMatchParams,
    GetRoutesParams,
    RouteProps
} from '@salesforce/pwa-kit-extension-sdk/types'

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

// CONTENT BELOW IS FOR TESTING ONLY. REMOVE BEFORE MERGING.
import {AddToCartModalProvider, useAddToCartModalContext} from './hooks/use-add-to-cart-modal'
import {Button} from '@chakra-ui/react'
import variant750518699578M from './mocks/variant-750518699578M'
import basketWithSuit from './mocks/basket-with-suit'
import {productsResponse} from './mocks/mock-data'

const AddToCartModalPage = () => {
    console.log('AddToCartModalPage: ', useAddToCartModalContext())
    const {
        isOpen: isAddToCartModalOpen,
        onOpen: onAddToCartModalOpen,
        onClose: onAddToCartModalClose
    } = useAddToCartModalContext()

    const handleOpenAddToCartModal = () => {
        onAddToCartModalOpen({
            product: productsResponse.data[0],
            itemsAdded: [
                {
                    product: productsResponse.data[0],
                    variant: productsResponse.data[0].variants[0],
                    quantity: 1
                }
            ],
            selectedQuantity: 1
        })
    }

    return <Button onClick={handleOpenAddToCartModal}>Open Add to Cart Modal</Button>
}

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
            {
                path: config.pages.Checkout && config.pages.Checkout.path,
                component: Pages.Checkout,
                exact: true
            },
            {
                path: '/use-add-to-cart-modal',
                component: () => {
                    return (
                        <AddToCartModalProvider>
                            <AddToCartModalPage />
                        </AddToCartModalProvider>
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
