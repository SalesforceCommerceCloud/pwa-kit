/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, withPageProvider} from '../../../utils/test-utils'
import MobileGrid2r1c from './index'

test('MobileGrid2r1c renders without errors', () => {
    const MobileGrid2r1cWithPageProvider = withPageProvider(MobileGrid2r1c)
    renderWithProviders(
        <MobileGrid2r1cWithPageProvider
            regions={[
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 1</p>'
                            },
                            id: '2f72a6a939df1527ec378f8509',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column1'
                },
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 2</p>'
                            },
                            id: 'c6171da06d6754700b8807777e',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column2'
                }
            ]}
        />
    )
    expect(document.querySelector('.mobile-2r-1c')).not.toBeNull()
})
