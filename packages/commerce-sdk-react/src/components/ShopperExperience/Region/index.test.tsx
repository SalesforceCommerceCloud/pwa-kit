/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import Region from './index'

const SAMPLE_REGION = {
    id: 'regionB',
    components: [
        {
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
    ]
}

test('Region renders without errors', () => {
    const {container} = render(<Region region={SAMPLE_REGION} />)

    // Regions are in document.
    expect(container.querySelectorAll('.region')?.length).toEqual(1)

    // Components are in document. (Note: Sub-regions/components aren't rendered because that is
    // the responsibility of the component definition.)
    expect(container.querySelectorAll('.component')?.length).toEqual(1)
})
