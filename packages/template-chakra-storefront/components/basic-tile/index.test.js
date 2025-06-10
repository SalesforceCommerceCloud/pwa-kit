/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import BasicTile from './index'

test('BasicTile renders without errors', () => {
    const data = {
        title: 'title',
        href: '/category/womens-outfits',
        img: {
            src: 'src',
            alt: 'alt'
        }
    }
    const {getByText} = renderWithProviders(<BasicTile {...data} />)

    expect(getByText('title')).toBeInTheDocument()
})
