/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import ListMenu from './index'
import {renderWithProviders} from '../../utils/test-utils'

describe('ListMenu', () => {
    test('ListMenu renders without errors', async () => {
        renderWithProviders(<ListMenu />, {
            wrapperProps: {initialCategories: {
                root: {
                    categories: [
                        {
                            id: 'mens',
                            name: 'Mens',
                            pageDescription:
                                "Men's range. Hard-wearing boots, jackets and clothing for unbeatable comfort day in, day out. Practical, easy-to-wear styles wherever you're headed.",
                            pageKeywords: 'mens boots, mens shoes, mens clothing, mens apparel, mens jackets',
                            pageTitle: "Men's Footwear, Outerwear, Clothing & Accessories",
                            parentCategoryId: 'root',
                            c_showInMenu: true,
                            image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-en/default/dw56b28e03/images/slot/sub_banners/cat-banner-mens-suits.jpg'
                        }
                    ],
                    id: 'root',
                    name: 'Storefront Catalog - Non-EN'
                }
            }
            }
        })

        const drawer = document.getElementById('chakra-toast-portal')

        const category = await waitFor(() => screen.getByText(/Mens/i))
        expect(category).toBeInTheDocument()
        expect(drawer).toBeInTheDocument()
        expect(screen.getByRole('navigation', {name: 'main'})).toBeInTheDocument()
    })
    test('ListMenu renders Spinner without root categories', () => {
        renderWithProviders(<ListMenu />, {
            wrapperProps: {initialCategories: {}}
        })

        const spinner = document.querySelector('.chakra-spinner')

        expect(spinner).toBeInTheDocument()
    })
})
