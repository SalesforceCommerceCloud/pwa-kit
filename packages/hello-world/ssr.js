/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const awsServerlessExpress = require('aws-serverless-express')
const express = require('express')

const IS_LOCAL = process.env['AWS_LAMBDA_FUNCTION_NAME'] === undefined
const PORT = process.env.PORT || 3000

const echo = (req, res) => {
    return res.json({
        protocol: req.protocol,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers,
        ip: req.ip
    })
}

const app = express()

app.all('*', echo)
app.set('json spaces', 4)

if (IS_LOCAL) {
    app.listen(PORT, () => console.log(`Running Express server @ http://127.0.0.1:${PORT}`))
    exports.get = () => {}
} else {
    const server = awsServerlessExpress.createServer(app)
    exports.get = (event, context) => {
        awsServerlessExpress.proxy(server, event, context)
    }
}
