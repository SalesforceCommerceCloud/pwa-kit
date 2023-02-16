/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Region} from '../../components/experience/region'

export const componentMapProxy = new Proxy(
    {},
    {
        // eslint-disable-next-line no-unused-vars
        get(_target, prop) {
            let componentClass
            switch (prop) {
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
