/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Region as RegionType} from '../types'
import {Component} from '../Component'

type RegionProps = {
    region: RegionType
    className?: string
}

/**
 * This component will render a page designer region given its serialized data object.
 *
 * @param Region
 * @returns JSX.Element
 */
export const Region = ({className, region}: RegionProps) => {
    const {id, components} = region

    return (
        <div id={id} className={`region ${className}`}>
            <div className="container">
                {components?.map((component) => (
                    <Component key={component.id} component={component} />
                ))}
            </div>
        </div>
    )
}

Region.displayName = 'Region'

export default Region
