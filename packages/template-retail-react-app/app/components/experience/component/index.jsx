/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePageContext} from '../page'
import {componentType} from '../types'

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param {PageProps} props
 * @param {Component} props.component - The page designer component data representation.
 * @returns {React.ReactElement} - Experience component.
 */
export const Component = ({component}) => {
    const pageContext = usePageContext()
    const ComponentClass =
        pageContext?.components[component.typeId] ||
        (({typeId}) => <div>{`Component type '${typeId}' not found!`}</div>)
    const {data, ...rest} = component

    return (
        <div id={component.id} className="component">
            <div className="container">
                <ComponentClass {...rest} {...data} />
            </div>
        </div>
    )
}

Component.displayName = 'Component'

Component.propTypes = {
    component: componentType.isRequired
}

export default Component
