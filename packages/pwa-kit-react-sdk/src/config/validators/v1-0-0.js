/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import isFQDN from 'validator/es/lib/isFQDN'

export default {
    'server.mobify.ssrParameters.proxyConfigs': (config) => {
        // this validator ensure proxy config's
        // "host" have the correct format
        const {proxyConfigs} = config.server.mobify.ssrParameters
        if (!proxyConfigs || !proxyConfigs.length) {
            return true
        }
        proxyConfigs.forEach((proxyConfig) => {
            if (!isFQDN(proxyConfig.host)) {
                throw new Error('Proxy config hosts must be a FQDN.')
            }
        })
    }
}
