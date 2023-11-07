/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Component as ComponentType} from '../types'
import {usePageContext} from '../Page'
import JsxParser from 'react-jsx-parser'

type ComponentProps = {
    component: ComponentType
    code?: string
}

const ComponentNotFound = ({typeId}: ComponentType) => (
    <div>{`Component type '${typeId}' not found!`}</div>
)
/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param {PageProps} props
 * @param {Component} props.component - The page designer component data representation.
 * @param {string} [props.code] - The raw JSW code for the component.
 * @returns {React.ReactElement} - Experience component.
 */
export const Component = ({component, code}: ComponentProps) => {
    const pageContext = usePageContext()
    const {data, ...rest} = component
    let instance = <ComponentNotFound {...rest} {...data} />
    if (code) {
        instance = <JsxParser components={pageContext?.jsxParserComponents} jsx={code} />
    } else if (pageContext?.components[component.typeId]) {
        const ComponentClass = pageContext?.components[component.typeId]
        instance = <ComponentClass {...rest} {...data} />
    }

    return (
        <div id={component.id} className="component">
            <div className="container">{instance}</div>
        </div>
    )
}

Component.displayName = 'Component'

export default Component
