/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const PAGEEVENTS = {
    PAGELOAD: 'PAGELOAD',
    ERROR: 'ERROR'
}
class Pages extends EventTarget {
    pageLoad(templateName, start, end) {
        const payload = {
            templateName,
            start,
            end
        }
        this.dispatchEvent(new CustomEvent(PAGEEVENTS.PAGELOAD, {detail: payload}))
    }
    error(name, content) {
        const payload = {
            name,
            content
        }
        this.dispatchEvent(new CustomEvent(PAGEEVENTS.ERROR, {detail: payload}))
    }
}

export const pages = new Pages()
