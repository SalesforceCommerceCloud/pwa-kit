/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {useQuery} from '@tanstack/react-query'

interface Props {
    value: number
}

const style = `
body {
    background: linear-gradient(-45deg, #e73c7e, #23a6d5, #ee7752);
    background-size: 400% 400%;
    height: 100vh;
}
h1 {
    font-size: 10em;
    font-weight: 900;
    letter-spacing: -0.05em;
    color: #fff;
}
.title {
    text-align: left;
}
`

const Home = ({value}: Props) => {
    return (
        <div>
            <style dangerouslySetInnerHTML={{__html: style}} />
            <div className="panel title">
                <h1>
                    Multi
                    <br />
                    Extensibility
                </h1>
            </div>
        </div>
    )
}

Home.getTemplateName = () => 'home'

Home.getProps = async () => {
    // Note: This is simply a mock function to demo deferred execution for fetching props (e.g.: Making a call to the server to fetch data)
    const getData = (a: number, b: number) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(a * b)
            }, 1000)
        })
    }
    const value = await getData(5, 7)
    return {value}
}

export default Home
