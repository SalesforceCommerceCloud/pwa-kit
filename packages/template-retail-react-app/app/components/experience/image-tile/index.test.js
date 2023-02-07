/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../../utils/test-utils'
import ImageTile from './index'

test('ImageTile renders without errors', () => {
    const {getByAltText} = renderWithProviders(
        <ImageTile
            imageProps={{
                alt: 'alt-text',
                src: {mobile: 'static/img/hero.png'}
            }}
        />
    )

    const image = getByAltText('alt-text')

    expect(image).toHaveAttribute('src', 'static/img/hero.png')
})
