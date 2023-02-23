/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, withPageProvider} from '../../../utils/test-utils'
import Carousel from './index'

const SAMPLE_REGION = {
    id: 'TEST_REGION',
    components: [
        {
            id: 'TEST_COMPONENT',
            typeId: 'test-component',
            data: {}
        }
    ]
}

test('Carousel renders without errors', () => {
    const {getByTestId} = renderWithProviders(<Carousel regions={[]} />)

    expect(getByTestId('carousel')).toBeDefined()
    expect(getByTestId('carousel-container')).toBeDefined()
    expect(getByTestId('carousel-container-items')).toBeDefined()
    expect(getByTestId('carousel-nav-left')).toBeDefined()
    expect(getByTestId('carousel-nav-left')).toBeDefined()
})

test('Carousel renders region/children without errors', () => {
    const CarouselWithPageProvider = withPageProvider(Carousel)
    const {getByTestId} = renderWithProviders(
        <CarouselWithPageProvider regions={[SAMPLE_REGION]} />
    )

    expect(getByTestId('carousel')).toBeDefined()
    expect(getByTestId('carousel-container-items').childElementCount).toEqual(1)
})
