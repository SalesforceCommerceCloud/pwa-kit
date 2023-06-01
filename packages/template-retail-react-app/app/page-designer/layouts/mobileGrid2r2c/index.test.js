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
import MobileGrid2r2c from '@salesforce/retail-react-app/app/page-designer/layouts/mobileGrid2r2c/index'

test('MobileGrid2r2c renders without errors', () => {
    const MobileGrid2r2cWithPageProvider = withPageProvider(MobileGrid2r2c)
    renderWithProviders(
        <MobileGrid2r2cWithPageProvider
            regions={[
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 1</p>'
                            },
                            id: '946afd022303cd30a8cdcb2957',
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
                            id: 'd94919f81bd9a5530400879fd9',
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
                            id: '883198f60f5d0f38ce1f895305',
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
                            id: '364bedd2f3fe569f7c83df780b',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column4'
                }
            ]}
        />
    )
    expect(document.querySelector('.mobile-2r-2c')).not.toBeNull()
})
