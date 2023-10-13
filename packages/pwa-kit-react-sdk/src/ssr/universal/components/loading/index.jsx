/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useHistory, useLocation} from 'react-router-dom'

const Loading = () => {
    const history = useHistory()
    const location = useLocation()

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const referrer = searchParams.get('referrer')

        setTimeout(() => history.replace(referrer), 1000)
    }, [])

    return (
        <>
            <style>
                {`
                .css-1iroqzg {
                    z-index: var(--chakra-zIndices-overlay);
                    position: absolute;
                    top: 0px;
                    left: 0px;
                    right: 0px;
                    bottom: 0px;
                    background: var(--chakra-colors-whiteAlpha-800);
                }
                .css-cvzky6 {
                    display: inline-block;
                    border-color: currentColor;
                    border-style: solid;
                    border-radius: 99999px;
                    border-width: 4px;
                    border-bottom-color: var(--chakra-colors-gray-200);
                    border-left-color: var(--chakra-colors-gray-200);
                    -webkit-animation: animation-b7n1on 0.65s linear infinite;
                    animation: animation-b7n1on 0.65s linear infinite;
                    width: var(--spinner-size);
                    height: var(--spinner-size);
                    --spinner-size: var(--chakra-sizes-12);
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-left: -1.5em;
                    margin-top: -1.5em;
                    color: var(--chakra-colors-blue-600);
                }
                .css-8b45rq {
                    border: 0px;
                    clip: rect(0, 0, 0, 0);
                    width: 1px;
                    height: 1px;
                    margin: -1px;
                    padding: 0px;
                    overflow: hidden;
                    white-space: nowrap;
                    position: absolute;
                }
                `}
            </style>

            <div className="css-1iroqzg">
                <div className="chakra-spinner css-cvzky6" data-testid="loading">
                    <span className="css-8b45rq">Loading...</span>
                </div>
            </div>
        </>
    )
}
Loading.displayName = 'Loading'

export default Loading
