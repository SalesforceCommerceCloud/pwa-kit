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
import MobileGrid3r2c from '@salesforce/retail-react-app/app/page-designer/layouts/mobileGrid3r2c/index'

test('MobileGrid3r2c renders without errors', () => {
    const MobileGrid3r2cWithPageProvider = withPageProvider(MobileGrid3r2c)
    renderWithProviders(
        <MobileGrid3r2cWithPageProvider
            regions={[
                {
                    components: [
                        {
                            data: {
                                richText: '<p>Column 1</p>'
                            },
                            id: 'c402f2fb1b323b257377c8ef6f',
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
                            id: 'c77c14f88859b3b7ce499ebb8b',
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
                            id: 'b5755966a27336b89f398ee12d',
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
                            id: 'f4383d7c570ff3ed0ff8a67832',
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
                            id: '2bfff9731055f24f00e115026a',
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
                            id: '0c9324527840d3d58b64eaf407',
                            typeId: 'commerce_assets.editorialRichText'
                        }
                    ],
                    id: 'column6'
                }
            ]}
        />
    )
    expect(document.querySelector('.mobile-3r-2c')).not.toBeNull()
})
