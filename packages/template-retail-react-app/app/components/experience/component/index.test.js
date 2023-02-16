/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import Component from './index'
import {PageContext} from '../page'

const SAMPLE_COMPONENT = {
    id: 'rfdvj4ojtltljw3',
    typeId: 'commerce_assets.carousel',
    data: {
        title: 'Topseller',
        category: 'topseller'
    },
    regions: [
        {
            id: 'regionB1',
            components: [
                {
                    id: 'rfdvj4ojtltljw3',
                    typeId: 'commerce_assets.carousel',
                    data: {
                        title: 'Topseller',
                        category: 'topseller'
                    }
                }
            ]
        }
    ]
}

const TEST_COMPONENTS = {
    ['commerce_assets.carousel']: () => <div className="carousel">Carousel</div>
}

test('Page throws if used outside of a Page component', () => {
    expect(() => render(<Component component={SAMPLE_COMPONENT} />)).toThrow()
})

test('Page renders correct component', () => {
    const component = <Component component={SAMPLE_COMPONENT} />

    const {container} = render(component, {
        // eslint-disable-next-line react/display-name
        wrapper: () => (
            <PageContext.Provider value={{components: TEST_COMPONENTS}}>
                {component}
            </PageContext.Provider>
        )
    })

    // Component are in document.
    expect(container.querySelectorAll('.component')?.length).toEqual(1)

    // Prodived components are in document. (Note: Sub-regions/components aren't rendered because that is
    // the responsibility of the component definition.)
    expect(container.querySelectorAll('.carousel')?.length).toEqual(1)
})
