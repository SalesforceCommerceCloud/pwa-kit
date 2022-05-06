/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'

import HelloTS from '../components/hello-typescript'
import HelloJS from '../components/hello-javascript'

interface Props {
    value: number
}

const style = `
body {
    background: linear-gradient(-45deg, #e73c7e, #23a6d5, #ee7752);
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
`

const Home = ({value}: Props) => {
    const [counter, setCounter] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter(counter + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [counter, setCounter])

    return (
        <div>
            <style dangerouslySetInnerHTML={{__html: style}} />
            <div className="loading-screen">
                <div className="panel title">
                    <h1>
                        Typescript
                        <br />
                        Support!
                    </h1>
                </div>
                <div className="panel">
                    <div className="divider"></div>
                </div>
                <div className="panel">
                    <p style={{width: '300px'}} className="fade-in fade-in-0">
                        <b>This page is written in Typescript</b>
                        <br />
                        <br />
                        Server-side getProps works if this is a valid expression: &quot;5 times 7 is{' '}
                        {value}
                        &quot;
                        <br />
                        <br />
                        Client-side JS works if this counter increments: {counter}
                        <br />
                        <br />
                        <b>You can mix-and-match JS and TS</b>
                        <br />
                        <br />
                        <HelloJS />
                        &nbsp;
                        <HelloTS message="it works!" />
                    </p>
                </div>
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
            }, 50)
        })
    }
    const value = await getData(5, 7)
    return {value}
}

export default Home
