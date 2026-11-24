/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const configs = require('@salesforce/pwa-kit-dev/configs/webpack/config')
const {CLIENT} = require('@salesforce/pwa-kit-dev/configs/webpack/config-names')

const client = configs.find(({name}) => name === CLIENT)

// The parser is only used by the opt-in overview. Keep it out of the shared vendor bundle.
client.optimization.splitChunks.cacheGroups.smartSearchMarkdown = {
    test: /[\\/]node_modules[\\/](markdown-it|entities|linkify-it|mdurl|punycode\.js|uc\.micro)[\\/]/,
    chunks: 'async',
    name: 'smart-search-markdown',
    priority: 20,
    enforce: true
}

module.exports = configs
