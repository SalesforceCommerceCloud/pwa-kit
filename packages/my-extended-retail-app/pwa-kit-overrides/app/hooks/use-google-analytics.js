/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// TODO: install gtag.js script into the html
export const useGoogleAnalytics = () => {
    return {
        sendSomeEvent() {
            console.log('--- GA: sending some event')
        }
    }
}
