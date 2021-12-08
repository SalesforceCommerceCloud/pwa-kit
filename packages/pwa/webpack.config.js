/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const webpackConfig = require('pwa-kit-react-sdk/webpack/config')
const {PwaKitConfigPlugin} = require('pwa-kit-react-sdk/webpack/plugins')

const customSchemas = [
    {
        key: 'commerceApi',
        required: true,
        schema: {
            $id: 'commerceApi',
            title: 'Commerceapi',
            type: 'object',
            required: ['clientId', 'organizationId', 'shortCode', 'siteId'],
            properties: {
                clientId: {
                    $id: 'commerceApi/clientId',
                    title: 'Clientid',
                    type: 'string',
                    default: '',
                    examples: ['11111111-1111-1111-1111-111111111111'],
                    pattern: '^.*$'
                },
                organizationId: {
                    $id: 'commerceApi/organizationId',
                    title: 'Organizationid',
                    type: 'string',
                    default: '',
                    examples: ['f_ecom_zzrf_001'],
                    pattern: '^.*$'
                },
                shortCode: {
                    $id: 'commerceApi/shortCode',
                    title: 'Shortcode',
                    type: 'string',
                    default: '',
                    examples: ['9o7m175y'],
                    pattern: '^.*$'
                },
                siteId: {
                    $id: 'commerceApi/siteId',
                    title: 'Siteid',
                    type: 'string',
                    default: '',
                    examples: ['RefArchGlobal'],
                    pattern: '^.*$'
                }
            }
        }
    },
    {
        key: 'einsteinApi',
        required: true,
        schema: {
            $id: 'einsteinApi',
            title: 'Einsteinapi',
            type: 'object',
            required: ['clientId', 'siteId'],
            properties: {
                clientId: {
                    $id: 'einsteinApi/clientId',
                    title: 'Clientid',
                    type: 'string',
                    default: '',
                    examples: ['11111111-1111-1111-1111-111111111111'],
                    pattern: '^.*$'
                },
                siteId: {
                    $id: 'einsteinApi/siteId',
                    title: 'Siteid',
                    type: 'string',
                    default: '',
                    examples: ['aaij-MobileFirst'],
                    pattern: '^.*$'
                }
            }
        }
    }
]

const extend = (configs) => {
    let [client, server, ...rest] = configs

    client.plugins.push(
        new PwaKitConfigPlugin({
            customSchemas
        })
    )

    return [client, server, ...rest]
}

module.exports = extend(webpackConfig)
