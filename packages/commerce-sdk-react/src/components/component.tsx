/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import Region from './region'

// Components 
// NOTE: This will not scale as the number of customizable components grows.
import ImageAndText from './assets/imageAndText'
import MobileGrid1r1c from './assets/mobileGrid1r1c'
import MobileGrid2r1c from './assets/mobileGrid2r1c'
import MobileGrid3r1c from './assets/mobileGrid3r1c'
import EditorialRichText from './assets/editorialRichText'
import PhotoTile from './assets/photoTile'
import MainBanner from './assets/mainBanner'

type ContentAttributes = {
    data: object,
    localized?: boolean
}

// TODO: You can bring in the type from the response value of the getPage method
// in commerce-sdk-iosomorphic once it's done.
type ComponentProps = {
    id: string,
    type_id: string,
    content_attributes: ContentAttributes,
    custom: object,
    regions: Array<any>,
    componentMap: any
}

const DefaultComponent = (props: any) => 
    <div>
        Component "{props.type}" Not Found
    </div>

const ComponentMap : any = {
    imageAndText: ImageAndText,
    mobileGrid1r1c: MobileGrid1r1c,
    mobileGrid2r1c: MobileGrid2r1c,
    mobileGrid3r1c: MobileGrid3r1c,
    editorialRichText: EditorialRichText,
    photoTile: PhotoTile,
    mainBanner: MainBanner
}

const Component = ({type_id, content_attributes, regions = [], componentMap = {}}: ComponentProps) => {
    const {data} = content_attributes || {}
    const type = type_id.split('.')[1]
    const Component = componentMap[type] || ComponentMap[type] || DefaultComponent

    return (
        <Component type={type} {...data}>
            {regions.map((region) => <Region {...region} componentMap={componentMap}/>)}
        </Component>
    )
}

export default Component

