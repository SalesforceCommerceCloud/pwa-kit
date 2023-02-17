/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Region} from '../../components/experience/region'

import * as Layouts from '../../components/experience/layouts'

export const componentMapProxy = new Proxy(
    {},
    {
        // eslint-disable-next-line no-unused-vars
        get(_target, prop) {
            let componentClass
            switch (prop) {
                case 'commerce_assets.editorialRichText':
                    componentClass = ({richText}) => (
                        <div dangerouslySetInnerHTML={{
                            __html: richText
                        }} />
                    )
                    break
                case 'commerce_layouts.mobileGrid1r1c':
                    componentClass = Layouts['MobileGrid1r1c']
                    break
                case 'commerce_layouts.mobileGrid2r1c':
                    componentClass = Layouts['MobileGrid2r1c']
                    break
                case 'commerce_layouts.mobileGrid2r2c':
                    componentClass = Layouts['MobileGrid2r2c']
                    break
                case 'commerce_layouts.mobileGrid2r3c':
                    componentClass = Layouts['MobileGrid2r3c']
                    break
                case 'commerce_layouts.mobileGrid3r1c':
                    componentClass = Layouts['MobileGrid3r1c']
                    break
                case 'commerce_layouts.mobileGrid3r2c':
                    componentClass = Layouts['MobileGrid3r2c']
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
