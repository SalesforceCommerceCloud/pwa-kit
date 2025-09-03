/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const DEFAULT_SERVICE_NAME = 'pwa-kit-react-sdk'

// Only call this function in the server context
// This wrapper function is necessary because if the config is in the top-level code
// process will be undefined as it gets executed in the browser context and will throw an uncaught error.
export const getOTELConfig = () => {
    return {
        serviceName: process.env.OTEL_SERVICE_NAME || DEFAULT_SERVICE_NAME,
        enabled: process.env.OTEL_TRACING_ENABLED === 'true'
    }
}

export const getServiceName = () => getOTELConfig().serviceName
