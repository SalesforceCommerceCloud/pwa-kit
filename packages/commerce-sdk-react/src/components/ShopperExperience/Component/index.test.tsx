/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import Component from './index'
import {PageContext, Page} from '../Page'
import {SAMPLE_PAGE} from '../Page/index.test'

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
    jest.spyOn(console, 'warn').mockImplementationOnce(jest.fn())
    expect(() => render(<Component component={SAMPLE_COMPONENT} />)).toThrow()
})

test('Page renders correct component', async () => {
    const component = <Component component={SAMPLE_COMPONENT} />

    const {container} = render(component, {
        // eslint-disable-next-line react/display-name
        wrapper: () => (
            <Page
                page={{
                    ...SAMPLE_PAGE,
                    regions: [...SAMPLE_PAGE.regions, SAMPLE_COMPONENT.regions[0]]
                }}
                components={TEST_COMPONENTS}
            >
                <PageContext.Provider value={{components: TEST_COMPONENTS}}>
                    {component}
                </PageContext.Provider>
            </Page>
        )
    })

    await waitFor(() => {
        // Component are in document.
        expect(container.querySelectorAll('.component')?.length).toEqual(3)

        // Prodived components are in document. (Note: Sub-regions/components aren't rendered because that is
        // the responsibility of the component definition.)
        expect(container.querySelectorAll('.carousel')?.length).toEqual(2)
    })
})
