/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useApplicationExtensions} from '@salesforce/pwa-kit-extension-sdk/react'

const style = `
.content {
    font-size: 18px;
    font-family: "Helvetica", sans-serif;
}
.content h1 {
    font-size: 8em;
    font-weight: 900;
    letter-spacing: -0.05em;
}
.loading-screen {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
.title {
    text-align: right;
}
.divider {
    width: 8px;
    background-color: black;
    height: 200px;
    margin-left: 5em;
    margin-right: 3em;
}
`

const Home = () => {
    const applicationExtensions = useApplicationExtensions()

    return (
        <section className="content">
            <style dangerouslySetInnerHTML={{__html: style}} />

            <div className="loading-screen">
                <div className="panel title">
                    <h1>Welcome!</h1>
                </div>
                <div className="panel">
                    <div className="divider"></div>
                </div>
                <div className="panel">
                    <div style={{width: '300px'}} className="fade-in fade-in-0">
                        <p>You have installed the following application extensions:</p>
                        <ul>
                            {applicationExtensions.length > 0 ? (
                                applicationExtensions?.map((extension, index) => (
                                    <li key={index}>{extension.getName()} Extension</li>
                                ))
                            ) : (
                                <li>None</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

Home.getTemplateName = () => 'home'

export default Home
