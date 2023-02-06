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

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param Region
 * @returns JSX.Element
 */
export const Component = ({component}: ComponentProps) => {
    const pageContext = usePageContext()
    const ComponentClass =
        pageContext?.components[component.typeId] ||
        (() => <div>{`Component type '${component.typeId}' not found!`}</div>)

    return <ComponentClass key={component.id} {...component} />
}

Component.displayName = 'Component'

export default Component
