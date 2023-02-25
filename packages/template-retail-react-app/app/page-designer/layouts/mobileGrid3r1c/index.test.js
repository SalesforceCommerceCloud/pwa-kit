/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, withPageProvider} from '../../../utils/test-utils'
import MobileGrid3r1c from './index'

test('MobileGrid3r1c renders without errors', () => {
    const MobileGrid3r1cWithPageProvider = withPageProvider(MobileGrid3r1c)
    renderWithProviders(
        <MobileGrid3r1cWithPageProvider
            regions={[
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 1</p>'
                            },
                            id: '5ed57137d30ec867ac716dd259',
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
                            id: '34e52dfa89fd2abd116912d706',
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
                            id: '80d8e4deead834c58505ecbf84',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column3'
                }
            ]}
        />
    )
    expect(document.querySelector('.mobile-3r-1c')).not.toBeNull()
})
