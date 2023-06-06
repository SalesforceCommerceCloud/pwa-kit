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
import MobileGrid1r1c from '@salesforce/retail-react-app/app/page-designer/layouts/mobileGrid1r1c/index'

test('MobileGrid1r1c renders without errors', () => {
    const MobileGrid1r1cWithPageProvider = withPageProvider(MobileGrid1r1c)
    renderWithProviders(
        <MobileGrid1r1cWithPageProvider
            regions={[
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 1</p>'
                            },
                            id: '6790e4a41380d31bf54b648e9c',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column1'
                }
            ]}
        />
    )
    expect(document.querySelector('.mobile-1r-1c')).not.toBeNull()
})
