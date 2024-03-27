/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
interface Props {
    value: number
}

const Home = ({value}: Props) => {
    return (
        <div>
            <h1>Home Page Plugin Extensions!</h1>
            <p>If you are seeing this it means that extensions are able to override files defined in other extensions defined before it.</p>
        </div>
    )
}

Home.getTemplateName = () => 'home'

export default Home
