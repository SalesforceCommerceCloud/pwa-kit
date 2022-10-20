/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import UserAgentParser from 'ua-parser-js'

const MOBIFY_DEVICETYPE = 'mobify_devicetype'

export const DESKTOP = 'DESKTOP'
export const PHONE = 'PHONE'
export const TABLET = 'TABLET'

export const detectDeviceType = (request) => {
    const forced = request.query[MOBIFY_DEVICETYPE]
    if (forced && [DESKTOP, PHONE, TABLET].includes(forced.toUpperCase())) {
        return forced
    }

    const cfMobile = `CloudFront-Is-${'Mobile'}-Viewer`
    const cfTablet = `CloudFront-Is-${'Tablet'}-Viewer`
    const cfDesktop = `CloudFront-Is-${'Desktop'}-Viewer`

    const useCloudfront = [cfMobile, cfTablet, cfDesktop].some(
        (header) => request.get(header) !== undefined
    )

    if (useCloudfront) {
        // CloudFront takes precedence, if any header was set.
        if (request.get(cfTablet) === 'true') {
            return TABLET
        } else if (request.get(cfMobile) === 'true') {
            return PHONE
        } else {
            return DESKTOP
        }
    } else {
        // Fall back to user-agent
        const device = new UserAgentParser(request.get('user-agent')).getDevice()
        const type = device && device.type
        switch (type) {
            case 'mobile':
                return PHONE
            case 'tablet':
                return TABLET
            default:
                return DESKTOP
        }
    }
}
