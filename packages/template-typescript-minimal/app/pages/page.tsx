/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Page, useShopperPage} from 'commerce-sdk-react'
import {useParams} from 'react-router-dom'
import loadable from '@loadable/component'

const Hello = loadable(() => import('../components/hello-typescript'))


interface Props {}

const style = ``

const PageViewer = (props: Props) => {
    const {pageId} = useParams()

    if (!pageId) {
        throw new Error('Page Id Required') 
    }

    const {data: page} = useShopperPage({parameters: {id: pageId}})

    return (
        <div>
            <link rel="stylesheet" href="https://zzrf-015.dx.commercecloud.salesforce.com/on/demandware.static/Sites-RefArch-Site/-/default/v1655861151998/css/global.css"></link>
            <link rel="stylesheet" href="https://zzrf-015.dx.commercecloud.salesforce.com/on/demandware.static/Sites-RefArch-Site/-/default/v1655861151998/css/experience/components/commerceAssets/imageAndTextCommon.css"></link>
            <h2>Page Designer</h2>
            
            {/* NOTE: Probably better to use a context instead of prop drilling here. */}
            <Page {...page} componentMap={{shopTheLook: Hello}}/>
        </div>
    )
}

PageViewer.getTemplateName = () => 'PageViewer'

export default PageViewer
