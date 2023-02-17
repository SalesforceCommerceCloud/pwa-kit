/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Region} from '../../components/experience/region'

import * as Layouts from '../../components/experience/layouts'

const withTitle = (Component) => {
    const WrappedComponent = (props) => {
        return (
            <div style={{position: 'relative'}}>
                <b
                    style={{
                        position: 'absolute',
                        background: 'rgb(220, 120, 120, 0.2)',
                        fontSize: '10px',
                        top: '0px',
                        right: '0px',
                        borderRadius: '5px',
                        padding: '2px'
                    }}
                >
                    {props.typeId.split('.')[1]}
                </b>
                <Component {...props} />
            </div>
        )
    }

    return WrappedComponent
}
export const componentMapProxy = new Proxy(
    {},
    {
        // eslint-disable-next-line no-unused-vars
        get(_target, prop) {
            let componentClass
            switch (prop) {
                case 'commerce_assets.editorialRichText':
                    componentClass = ({richText}) => (
                        <div
                            dangerouslySetInnerHTML={{
                                __html: richText
                            }}
                        />
                    )
                    break
                case 'commerce_layouts.mobileGrid1r1c':
                    componentClass = withTitle(Layouts['MobileGrid1r1c'])
                    break
                case 'commerce_layouts.mobileGrid2r1c':
                    componentClass = withTitle(Layouts['MobileGrid2r1c'])
                    break
                case 'commerce_layouts.mobileGrid2r2c':
                    componentClass = withTitle(Layouts['MobileGrid2r2c'])
                    break
                case 'commerce_layouts.mobileGrid2r3c':
                    componentClass = withTitle(Layouts['MobileGrid2r3c'])
                    break
                case 'commerce_layouts.mobileGrid3r1c':
                    componentClass = withTitle(Layouts['MobileGrid3r1c'])
                    break
                case 'commerce_layouts.mobileGrid3r2c':
                    componentClass = withTitle(Layouts['MobileGrid3r2c'])
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
