/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Page, Region} from 'commerce-sdk-react-preview/components'
import SamplePage from './sample-page.json'
import Carousel from '../../components/experience/carousel'

const componentMapProxy = new Proxy(
    {},
    {
        // eslint-disable-next-line no-unused-vars
        get(_target, prop) {
            let componentClass
            switch (prop) {
                case 'commerce_assets.productTile':
                    componentClass = ({id}) => (
                        <img src={`https://picsum.photos/seed/${id}/200/300`} />
                    )
                    break
                case 'commerce_layouts.carousel':
                    componentClass = Carousel
                    break
                default:
                    componentClass = (props) => (
                        <div style={{marginBottom: '10px'}}>
                            <b>{props.typeId}</b>
                            {props?.regions?.map((region) => (
                                <Region
                                    style={{margin: '0px 0px 5px 20px'}}
                                    key={region.id}
                                    region={region}
                                />
                            ))}
                        </div>
                    )
            }

            return componentClass
        }
    }
)

const PageViewer = () => {
    return <Page page={SamplePage} components={componentMapProxy} />
}

export default PageViewer
