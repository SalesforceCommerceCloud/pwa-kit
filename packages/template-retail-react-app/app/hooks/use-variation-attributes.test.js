/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router'

import {render} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {useVariationAttributes} from '@salesforce/retail-react-app/app/hooks/use-variation-attributes'

// Below is a partial product used for mocking purposes. Note: only the properties
// that are used in the hook at defined.
const MockProduct = {
    master: {
        masterId: '73910532M',
        orderable: true,
        price: 195
    },
    imageGroups: [
        {
            images: [
                {
                    alt: 'Basic Leg Trousers, , swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6cc11129/images/swatch/90011212_001_sw.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6cc11129/images/swatch/90011212_001_sw.jpg',
                    title: 'Basic Leg Trousers, '
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Basic Leg Trousers, Black, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6cc11129/images/swatch/90011212_001_sw.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6cc11129/images/swatch/90011212_001_sw.jpg',
                    title: 'Basic Leg Trousers, Black'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: '001'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        }
    ],
    variants: [
        {
            orderable: true,
            price: 195,
            productId: '883858858302M',
            variationValues: {
                color: '001',
                size: '28'
            }
        }
    ],
    variationAttributes: [
        {
            id: 'color',
            name: 'Color',
            values: [
                {
                    name: 'Black',
                    orderable: true,
                    value: '001'
                }
            ]
        },
        {
            id: 'size',
            name: 'Size',
            values: [
                {
                    name: '28',
                    orderable: true,
                    value: '28'
                }
            ]
        }
    ]
}

const MockComponent = () => {
    const params = useVariationAttributes(MockProduct)

    return (
        <script data-testid="variationAttributes" type="application/json">
            {JSON.stringify(params)}
        </script>
    )
}

// Mock product for testing hook behavior
const MockMultiVariantProduct = {
    id: '793775370033',
    variants: [
        {
            productId: '793775370033M',
            orderable: true,
            variationValues: {color: 'turquoise', size: 'M'}
        },
        {
            productId: '793775370033R',
            orderable: true,
            variationValues: {color: 'red', size: 'M'}
        }
    ],
    variationAttributes: [
        {
            id: 'color',
            name: 'Color',
            values: [
                {value: 'turquoise', name: 'Turquoise', orderable: true},
                {value: 'red', name: 'Red', orderable: true}
            ]
        },
        {
            id: 'size',
            name: 'Size',
            values: [{value: 'M', name: 'M', orderable: true}]
        }
    ]
}

const MultiVariantTestComponent = () => {
    const params = useVariationAttributes(MockMultiVariantProduct, false, false)

    return (
        <script data-testid="multiVariantAttributes" type="application/json">
            {JSON.stringify(params)}
        </script>
    )
}

describe('The useVariationAttributes', () => {
    test('returns variation attributes decorated with hrefs and images.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue&size=2')
        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(wrapper.getByTestId('variationAttributes').text).toBe(
            '[{"id":"color","name":"Color","values":[{"name":"Black","orderable":false,"value":"001","image":{"alt":"Basic Leg Trousers, Black, swatch","disBaseLink":"https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6cc11129/images/swatch/90011212_001_sw.jpg","link":"https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6cc11129/images/swatch/90011212_001_sw.jpg","title":"Basic Leg Trousers, Black"},"href":"/test/path?color=001&size=2"}],"selectedValue":{"value":"blue"}},{"id":"size","name":"Size","values":[{"name":"28","orderable":false,"value":"28","href":"/test/path?color=blue&size=28"}],"selectedValue":{"value":"2"}}]'
        )
    })

    describe('Hook Level Behavior (No Filtering)', () => {
        test('useVariationAttributes shows all variants regardless of bonus product context', () => {
            const history = createMemoryHistory()
            history.push('/test/path')

            const wrapper = render(
                <Router history={history}>
                    <MultiVariantTestComponent />
                </Router>
            )

            const result = JSON.parse(wrapper.getByTestId('multiVariantAttributes').textContent)
            const colorAttribute = result.find((attr) => attr.id === 'color')

            // Hook level should always show all variants - filtering happens at modal level
            expect(colorAttribute.values).toHaveLength(2)
            expect(colorAttribute.values.find((v) => v.value === 'turquoise')).toBeDefined()
            expect(colorAttribute.values.find((v) => v.value === 'red')).toBeDefined()
        })

        test('useVariationAttributes maintains original interface without bonus product parameters', () => {
            const history = createMemoryHistory()
            history.push('/test/path')

            // Test that the hook works without bonus product parameters
            const MockComponentNoBonus = () => {
                const params = useVariationAttributes(MockMultiVariantProduct, false, false)
                return (
                    <script data-testid="noBonus" type="application/json">
                        {JSON.stringify(params)}
                    </script>
                )
            }

            const wrapper = render(
                <Router history={history}>
                    <MockComponentNoBonus />
                </Router>
            )

            const result = JSON.parse(wrapper.getByTestId('noBonus').textContent)
            expect(result).toBeDefined()
            expect(result).toHaveLength(2) // color and size attributes
        })
    })
})
