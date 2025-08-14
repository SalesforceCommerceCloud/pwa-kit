/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const getAdyenConfigForCurrentSite = (currentSiteId) => {
    return {
        apiKey: setProperty(currentSiteId, ADYEN_ENV.ADYEN_API_KEY),
        clientKey: setProperty(currentSiteId, ADYEN_ENV.ADYEN_CLIENT_KEY),
        environment: setProperty(currentSiteId, ADYEN_ENV.ADYEN_ENVIRONMENT),
        merchantAccount: setProperty(currentSiteId, ADYEN_ENV.ADYEN_MERCHANT_ACCOUNT),
        systemIntegratorName: setProperty(currentSiteId, ADYEN_ENV.SYSTEM_INTEGRATOR_NAME),
        webhookUser: setProperty(currentSiteId, ADYEN_ENV.ADYEN_WEBHOOK_USER),
        webhookPassword: setProperty(currentSiteId, ADYEN_ENV.ADYEN_WEBHOOK_PASSWORD),
        webhookHmacKey: setProperty(currentSiteId, ADYEN_ENV.ADYEN_HMAC_KEY),
        liveEndpointUrlPrefix: setProperty(currentSiteId, ADYEN_ENV.ADYEN_LIVE_URL_PREFIX),
        appleDomainAssociation: setProperty(currentSiteId, ADYEN_ENV.ADYEN_APPLE_DOMAIN_ASSOCIATION)
    }
}

export const setProperty = (currentSiteId, property) => {
    const siteEnv = currentSiteId ? `${currentSiteId}_${property}` : property
    if (Object.hasOwn(process.env, siteEnv)) {
        return process.env[siteEnv]
    }
    return ''
}

const ADYEN_ENV = {
    ADYEN_API_KEY: 'ADYEN_API_KEY',
    ADYEN_CLIENT_KEY: 'ADYEN_CLIENT_KEY',
    ADYEN_ENVIRONMENT: 'ADYEN_ENVIRONMENT',
    ADYEN_MERCHANT_ACCOUNT: 'ADYEN_MERCHANT_ACCOUNT',
    SYSTEM_INTEGRATOR_NAME: 'SYSTEM_INTEGRATOR_NAME',
    ADYEN_WEBHOOK_USER: 'ADYEN_WEBHOOK_USER',
    ADYEN_WEBHOOK_PASSWORD: 'ADYEN_WEBHOOK_PASSWORD',
    ADYEN_HMAC_KEY: 'ADYEN_HMAC_KEY',
    ADYEN_LIVE_URL_PREFIX: 'ADYEN_LIVE_URL_PREFIX',
    ADYEN_APPLE_DOMAIN_ASSOCIATION: 'ADYEN_APPLE_DOMAIN_ASSOCIATION'
}
