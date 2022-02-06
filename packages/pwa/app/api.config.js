/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const commerceAPIConfig = {
    proxyPath: `/mobify/proxy/api`,
    parameters: {
        clientId: '987fc116-d30c-4537-93cb-c2bd433c3b5a',
        organizationId: 'f_ecom_zzrf_002',
        shortCode: 'kv7kzm78',
        siteId: 'RefArch'
    }
}
export const einsteinAPIConfig = {
    proxyPath: `/mobify/proxy/einstein`,
    einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
    // This differs from the siteId in commerceAPIConfig for testing purposes
    siteId: 'aaij-MobileFirst'
}
