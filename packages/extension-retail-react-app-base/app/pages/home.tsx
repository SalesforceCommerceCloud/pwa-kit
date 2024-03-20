/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import HelloTS from '../components/hello-typescript'
interface Props {
    value: number
}

const Home = ({value}: Props) => {
    return (
        <div>
            <h1>Home Page</h1>
            <HelloTS message="hello from the home page"/>
        </div>
    )
}

Home.getTemplateName = () => 'home'

export default Home
