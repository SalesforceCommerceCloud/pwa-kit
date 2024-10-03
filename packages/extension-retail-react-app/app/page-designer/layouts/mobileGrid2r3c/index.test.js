/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    renderWithProviders,
    withPageProvider
} from '@salesforce/retail-react-app/app/utils/test-utils'
import MobileGrid2r3c from '@salesforce/retail-react-app/app/page-designer/layouts/mobileGrid2r3c/index'

test('MobileGrid2r3c renders without errors', () => {
    const MobileGrid2r3cWithPageProvider = withPageProvider(MobileGrid2r3c)
    renderWithProviders(
        <MobileGrid2r3cWithPageProvider
            regions={[
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 1</p>'
                            },
                            id: '88db479f5ea7d51049ad36290e',
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
                            id: '73893773e40906e8274693e560',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column2'
                },
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 3</p>'
                            },
                            id: '514c04a9d5d2fe184f54373c44',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column3'
                },
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 4</p>'
                            },
                            id: '8eb52298268dc948b86141a8be',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column4'
                },
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 5</p>'
                            },
                            id: '92bb6e9a7472c49425e74f4b00',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column5'
                },
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 6</p>'
                            },
                            id: '5ebdc5413f9898dfad3e5d12aa',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column6'
                }
            ]}
        />
    )
    expect(document.querySelector('.mobile-2r-3c')).not.toBeNull()
})
