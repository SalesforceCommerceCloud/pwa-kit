/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../../utils/test-utils'
import ImageTile from './index'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'

test('ImageTile renders without errors', () => {
    const {getByTestId} = renderWithProviders(
        <ImageTile
            image={{
                _type: 'Image',
                focalPoint: {
                    _type: 'Imagefocalpoint',
                    x: 0.5,
                    y: 0.5
                },
                url: `${getAssetUrl('static/img/hero.png')}`
            }}
        />
    )

    const image = getByTestId('image-tile-image')

    expect(image).toHaveAttribute('src', `${getAssetUrl('static/img/hero.png')}`)
})
