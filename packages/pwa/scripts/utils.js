/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const Promise = require('bluebird')
const fetch = require('cross-fetch')
const kill = require('tree-kill')
const spawn = require('cross-spawn')

/**
 * Execute fn with an Express app process running in the background and handle server
 * setup and teardown.
 */
const withSSRServer = (fn) => {
    const ssrServer = spawn('npm', ['start'], {stdio: 'ignore'})

    // Use tree-kill module to kill the complete process subtree. We haven't
    // been able to find a cleaner, more reliable way of doing this on Windows.
    const cleanUp = () => kill(ssrServer.pid)

    const ping = () =>
        fetch('http://localhost:3000')
            .then((res) => res.ok)
            .catch(() => false)

    const waitForResponse = (max = 210000, interval = 5000) => {
        const poll = (start, attempt) => {
            console.log(`[Poll] Waiting for Express app to start (Attempt ${attempt})`)
            return Promise.delay(interval)
                .then(() => ping())
                .then((responded) => {
                    if (responded) {
                        console.log(`[Poll] Server is running`)
                        return Promise.resolve()
                    } else {
                        const now = new Date().getTime()
                        const elapsed = now - start
                        const remaining = max - elapsed
                        if (remaining > 0) {
                            console.log(`[Poll] No response. ${max - elapsed}ms remaining`)
                            return Promise.delay(interval).then(() => poll(start, attempt + 1))
                        } else {
                            return Promise.reject(`[Poll] No response. Timeout at ${elapsed}`)
                        }
                    }
                })
        }
        return poll(new Date().getTime(), 1)
    }

    return waitForResponse()
        .then(() => fn())
        .then(() => {
            cleanUp()
        })
        .catch((err) => {
            cleanUp()
            return Promise.reject(err)
        })
}

module.exports = {withSSRServer}
