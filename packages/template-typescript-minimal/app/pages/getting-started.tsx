/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

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
.content p,
.content ul {
    margin: 1em 0;
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
    height: 300px;
    margin-left: 5em;
    margin-right: 3em;
}
.button {
    display: inline-block;
    padding: 10px 20px;
    font-size: 16px;
    font-weight: bold;
    color: white;
    background-color: #0176D3;
    text-align: center;
    text-decoration: none;
    border-radius: 5px;
}
`

const GettingStarted = () => {
    return (
        <section className="content">
            <style dangerouslySetInnerHTML={{__html: style}} />

            <div className="loading-screen">
                <div className="title">
                    <h1>Welcome!</h1>
                </div>
                <div>
                    <div className="divider"></div>
                </div>
                <div>
                    <div style={{width: '300px'}}>
                        <p>
                            <a
                                href="https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/developer-workflow.html"
                                className="button"
                            >
                                Get started
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

GettingStarted.getTemplateName = () => 'getting-started'

export default GettingStarted
