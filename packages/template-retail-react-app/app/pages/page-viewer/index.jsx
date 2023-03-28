import React from 'react'
import {Box} from '@chakra-ui/react'
import {Page, pageType} from '../../page-designer'
import {ImageTile, ImageWithText} from '../../page-designer/assets'
import {
    Carousel,
    MobileGrid1r1c,
    MobileGrid2r1c,
    MobileGrid2r2c,
    MobileGrid2r3c,
    MobileGrid3r1c,
    MobileGrid3r2c
} from '../../page-designer/layouts'

import {HTTPError, HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

const PAGEDESIGNER_TO_COMPONENT = {
    'commerce_assets.photoTile': ImageTile,
    'commerce_assets.imageAndText': ImageWithText,
    'commerce_layouts.carousel': Carousel,
    'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c,
    'commerce_layouts.mobileGrid2r1c': MobileGrid2r1c,
    'commerce_layouts.mobileGrid2r2c': MobileGrid2r2c,
    'commerce_layouts.mobileGrid2r3c': MobileGrid2r3c,
    'commerce_layouts.mobileGrid3r1c': MobileGrid3r1c,
    'commerce_layouts.mobileGrid3r2c': MobileGrid3r2c
}

const PageViewer = ({page}) => (
    <Box layerStyle={'page'}>
        <Page page={page} components={PAGEDESIGNER_TO_COMPONENT} />
    </Box>
)

PageViewer.getProps = async ({api, params}) => {
    const {pageId} = params
    const page = await api.shopperExperience.getPage({
        parameters: {pageId}
    })

    if (page.isError) {
        let ErrorClass = page.type?.endsWith('page-not-found') ? HTTPNotFound : HTTPError
        throw new ErrorClass(page.detail)
    }

    return {page}
}

PageViewer.displayName = 'PageViewer'

PageViewer.propTypes = {
    page: pageType.isRequired
}

export default PageViewer
