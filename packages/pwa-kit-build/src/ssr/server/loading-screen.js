/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const loadingScreen = () => {
    return `
        <!doctype html>
        <head>
            <meta charset="utf-8"/>
            <title>Managed Runtime</title>
            <style>
                body {
                    background: linear-gradient(-45deg, #e73c7e, #23a6d5, #23d5ab, #ee7752);
                    background-size: 400% 400%;
                    animation: gradient 10s ease infinite;
                    height: 100vh;
                }
                @keyframes gradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                @keyframes fade {
                  0% { opacity: 0 }
                  100% { opacity: 1 }
                }
                .fade-in {
                    font-size: 18px;
                    opacity: 0;
                    animation: fade 1s ease-in-out;
                    animation-fill-mode: forwards;
                }
                .fade-in-0 { animation-delay: 0s}
                .fade-in-1 { animation-delay: 4s}
                .fade-in-2 { animation-delay: 8s}
                .fade-in-3 { animation-delay: 12s}
                .fade-in-4 { animation-delay: 16s}
                .fade-in-5 { animation-delay: 20s}
                body {
                    font-family: "Helvetica", sans-serif;
                    font-weight: 300;
                    color: rgba(255,255,255,0.8);
                    color: chartreuse;
                }
                .loading-screen {
                    mix-blend-mode: color-dodge;
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                h1 {
                    font-size: 10em;
                    font-weight: 900;
                    letter-spacing: -0.05em;
                }
                .title {
                    text-align: right;
                }
                .divider {
                    mix-blend-mode: lighten;
                    width: 8px;
                    background-color: chartreuse;
                    height: 507px;
                    margin-left: 5em;
                    margin-right: 3em;
                }
            </style>
        </head>
        <body>
            <div class="loading-screen">
                <div class="panel title">
                    <h1>Managed<br/>Runtime</h1>
                </div>
                <div class="panel">
                    <div class="divider"></div>
                </div>
                <div class="panel">
                    <p class="fade-in fade-in-0">Compiling Javascript...</p>
                    <p class="fade-in fade-in-1">Optimizing assets...</p>
                </div>
            </div>
            <script>
                const url = new URL(window.location)
                const loading = url.searchParams.get('loading')
                if(loading === '1') {
                    const waitForReady = () => {
                        return new Promise((resolve) => {
                            const inner = () => {
                                Promise.resolve()
                                    .then(() => fetch('/__mrt/status'))
                                    .then((res) => res.json())
                                    .then((data) => {
                                        if (data.ready) {
                                            resolve()
                                        } else {
                                            setTimeout(inner, 1000)
                                        }
                                    })
                            }
                            inner()
                        })
                    }
                    waitForReady().then(() => {
                        window.location = url.origin
                    })
                }
            </script>
        </body>
        </html>
    `
}
