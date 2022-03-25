/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const config = require('pwa-kit-build/configs/webpack/config')
const [client, ssr, renderer, clientOptional, requestProcessor] = config;

const ProgressPlugin = require('progress-webpack-plugin')

console.log("in custom webpack")

client.plugins.push(new ProgressPlugin(true))
ssr.plugins.push(new ProgressPlugin(true))
renderer.plugins.push(new ProgressPlugin(true))
clientOptional.plugins.push(new ProgressPlugin(true))
requestProcessor.plugins.push(new ProgressPlugin(true))

module.exports = [client, ssr, renderer, clientOptional, requestProcessor]
