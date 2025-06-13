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
import {STANDARD_PRODUCT_VARIATION_ATTRIBUTE} from '@salesforce/retail-react-app/app/constants'

// Below is a partial product used for mocking purposes. Note: only the properties
// that are used in the hook at defined.
const MockProduct = {
    id: '73910532M',
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

// Mock standard product based on the new mock file
const MockStandardProduct = {
    id: 'canon-eos-50d-bodyM',
    type: {
        item: true
    },
    inventory: {
        orderable: true
    }
}

const MockStandardComponent = () => {
    const params = useVariationAttributes(MockStandardProduct)

    return (
        <script data-testid="standardVariationAttributes" type="application/json">
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

    test('returns single variant attribute for standard products', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        const wrapper = render(
            <Router history={history}>
                <MockStandardComponent />
            </Router>
        )
        const result = JSON.parse(wrapper.getByTestId('standardVariationAttributes').text)
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(STANDARD_PRODUCT_VARIATION_ATTRIBUTE)
    })
})
