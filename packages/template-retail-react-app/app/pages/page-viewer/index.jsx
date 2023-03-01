/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Page, pageType} from '../../page-designer'
import {ImageTile, ImageWithText} from '../../page-designer/assets'
import {Carousel, MobileGrid2r1c} from '../../page-designer/layouts'
import {Box} from '@chakra-ui/react'

const PageViewer = ({page}) => (
    <Box layerStyle={'page'}>
        <Page
            page={page}
            components={{
                'commerce_layouts.carousel': Carousel,
                'commerce_layouts.mobileGrid2r1c': MobileGrid2r1c,
                'commerce_assets.photoTile': ImageTile,
                'commerce_assets.imageAndText': ImageWithText
            }}
        />
    </Box>
)

PageViewer.getProps = async ({api, params}) => {
    const page = await api.shopperExperience.getPage({
        parameters: {
            pageId: params.pageId
        }
    })

    return {
        page
    }
}

PageViewer.displayName = 'PageViewer'

PageViewer.propTypes = {
    page: pageType.isRequired
}

export default PageViewer
