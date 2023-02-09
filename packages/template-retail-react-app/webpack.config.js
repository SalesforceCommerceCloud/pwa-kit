/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const configs = require('pwa-kit-dev/configs/webpack/config')
const {SERVER, CLIENT} = require('pwa-kit-dev/configs/webpack/config-names')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const clientConfig = configs.find((c) => c.name === CLIENT)
const serverConfig = configs.find((c) => c.name === SERVER)
const configsToUpdate = [clientConfig, serverConfig]

configsToUpdate.forEach((config) => {
    // https://github.com/webpack-contrib/mini-css-extract-plugin
    config.module.rules.push({
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
    })
    config.plugins.push(new MiniCssExtractPlugin({filename: 'global.css'}))
})

module.exports = configs
