/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const config = require('pwa-kit-react-sdk/webpack/config')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

config[0].module.rules.push({
    test: /\.(sa|sc|c)ss$/,
    use: [MiniCssExtractPlugin.loader, 'css-loader']
})
config[0].plugins.push(new MiniCssExtractPlugin({filename: '[name].css'}))
config[1].module.rules.push({
    test: /\.(sa|sc|c)ss$/,
    use: [MiniCssExtractPlugin.loader, 'css-loader']
})
config[1].plugins.push(new MiniCssExtractPlugin({filename: '[name].css'}))

module.exports = config
