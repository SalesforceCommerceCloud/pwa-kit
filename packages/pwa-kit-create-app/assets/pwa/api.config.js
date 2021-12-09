/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
exports.template = ({commerceApi, einsteinApi}) => `
export const commerceAPIConfig = {
    proxyPath: \`/mobify/proxy/${commerceApi.proxyPath}\`,
    parameters: {
        clientId: '${commerceApi.clientId}',
        organizationId: '${commerceApi.organizationId}',
        shortCode: '${commerceApi.shortCode}',
        siteId: '${commerceApi.siteId}'
    }
}
export const einsteinAPIConfig = {
    proxyPath: \`/mobify/proxy/${einsteinApi.proxyPath}\`,
    einsteinId: '${einsteinApi.einsteinId}',
    siteId: '${einsteinApi.siteId}'
}
`
