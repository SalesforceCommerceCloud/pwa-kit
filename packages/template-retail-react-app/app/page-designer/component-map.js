/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ImageWithText, ImageTile} from '@salesforce/retail-react-app/app/page-designer/assets'
import {
    Carousel,
    Header,
    MobileGrid1r1c,
    MobileGrid2r1c,
    MobileGrid2r2c,
    MobileGrid2r3c,
    MobileGrid3r1c,
    MobileGrid3r2c
} from '@salesforce/retail-react-app/app/page-designer/layouts'
import {AnnouncementBanner} from '@salesforce/retail-react-app/app/page-designer/content'

// Map Page Designer component type IDs to React components
export const PAGEDESIGNER_TO_COMPONENT = {
    'commerce_assets.imageAndText': ImageWithText,
    'commerce_assets.imageTile': ImageTile,
    'commerce_layouts.carousel': Carousel,
    'commerce_layouts.header': Header,
    'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c,
    'commerce_layouts.mobileGrid2r1c': MobileGrid2r1c,
    'commerce_layouts.mobileGrid2r2c': MobileGrid2r2c,
    'commerce_layouts.mobileGrid2r3c': MobileGrid2r3c,
    'commerce_layouts.mobileGrid3r1c': MobileGrid3r1c,
    'commerce_layouts.mobileGrid3r2c': MobileGrid3r2c,
    'commerce_assets.announcementBanner': AnnouncementBanner
}
