/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Link} from 'react-router-dom'
import routes from '../routes'

interface Props {
    value: number
}

const Welcome = ({value}: Props) => {
    return (
        <div>
            <h1>Welcome to Extensibility 2.0</h1>
            <h4>Routes:</h4>
            <ul>
                {routes.map(({path}) => {
                    return (
                        <li key={path}>
                            <Link to={`${path}`}>{path}</Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

Welcome.getTemplateName = () => 'welcome'

export default Welcome
