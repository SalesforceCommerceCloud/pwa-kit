/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {ComponentDef} from '../types'
import {usePageContext} from '../Page'

type ComponentProps = {
    component: ComponentDef
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
        ((props: any) => <div>Component Not Found: ${props.typeId}</div>)

    return <ComponentClass key={component.id} {...component} />
}

Component.displayName = 'Component'

export default Component
