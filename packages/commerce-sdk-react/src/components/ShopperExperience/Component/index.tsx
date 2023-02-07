/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Component as ComponentType} from '../types'
import {usePageContext} from '../Page'

type ComponentProps = {
    component: ComponentType
}

const ComponentNotFound = ({typeId}: ComponentType) => (
    <div>{`Component type '${typeId}' not found!`}</div>
)
/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param Region
 * @returns JSX.Element
 */
export const Component = ({component}: ComponentProps) => {
    const pageContext = usePageContext()
    const ComponentClass = pageContext?.components[component.typeId] || ComponentNotFound

    return (
        <div className="component">
            <div className="container">
                <ComponentClass key={component.id} {...component} />
            </div>
        </div>
    )
}

Component.displayName = 'Component'

export default Component
