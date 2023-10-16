/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

const LoadingSpinner = () => {
    return (
        <>
            <style>
                {`
                .pwa-kit-loading-spinner-outer {
                    z-index: 1300;
                    position: absolute;
                    top: 0px;
                    left: 0px;
                    right: 0px;
                    bottom: 0px;
                    background: rgba(255, 255, 255, 0.80);
                }
                .pwa-kit-loading-spinner-wrapper {
                    display: inline-block;
                    border-color: currentColor;
                    border-style: solid;
                    border-radius: 99999px;
                    border-width: 4px;
                    border-bottom-color: #C9C9C9;
                    border-left-color: #C9C9C9;
                    -webkit-animation: animation-b7n1on 0.65s linear infinite;
                    animation: animation-b7n1on 0.65s linear infinite;
                    width: 3rem;
                    height: 3rem;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-left: -1.5em;
                    margin-top: -1.5em;
                    color: #0176D3;
                }
                .pwa-kit-loading-spinner-inner {
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

            <div className="pwa-kit-loading-spinner-outer" data-testid="loading-spinner">
                <div className="pwa-kit-loading-spinner-wrapper">
                    <span className="pwa-kit-loading-spinner-inner">Loading...</span>
                </div>
            </div>
        </>
    )
}
LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner
