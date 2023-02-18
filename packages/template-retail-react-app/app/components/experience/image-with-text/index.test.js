/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ImageWithText from './index'
import {renderWithProviders} from '../../../utils/test-utils'

const SAMPLE_DATA = {
    ITCLink: 'https://salesforce.com',
    ITCText:
        '<p><em>Text</em> <strong>Below</strong> <u>Image</u> <s>test</s> Image With Text Component <a href="https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/homepage-example.html?lang=en_US" target="_self" data-link-type="page" data-link-label="homepage-example" data-content-page-id="homepage-example">Home-page example link</a><img src="https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Library-Sites-RefArchSharedLibrary/default/dw89c1031d/images/myaccount_addresses.png" alt="alt tag myaccount_addresses image"></p>',
    image: {
        _type: 'Image',
        focalPoint: {
            _type: 'Imagefocalpoint',
            x: 0.5,
            y: 0.5
        },
        metaData: {
            _type: 'Imagemetadata',
            height: 1280,
            width: 1920
        },
        url: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Library-Sites-RefArchSharedLibrary/default/dw34c389b5/images/SearchBanner/search.jpg'
    },
    heading:
        '<p><em>Text</em> <strong>Overlay</strong> <s>test</s> <u>Image</u> With Text <a href="https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/mens/?lang=en_US" target="_self" data-link-type="category" data-link-label="Mens" data-category-id="mens" data-category-catalog-id="storefront-catalog-m-en">Component Link</a><img src="https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Library-Sites-RefArchSharedLibrary/default/dw2d9142bf/images/myaccount_registry.png" alt="alt text myaccount_registry image"></p>',
    alt: 'Alt Text test Image With Text Component'
}

test('Page renders correct component', () => {
    const {getByText} = renderWithProviders(<ImageWithText {...SAMPLE_DATA} />)

    expect(getByText(/image with text component/i)).toBeInTheDocument()
})
