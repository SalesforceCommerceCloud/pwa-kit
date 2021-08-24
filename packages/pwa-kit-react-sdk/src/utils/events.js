/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import ee from 'event-emitter'

export const PAGEEVENTS = {
    PAGELOAD: 'PAGELOAD',
    ERROR: 'ERROR'
}
class Pages {
    pageLoad(templateName, start, end) {
        const payload = {
            templateName,
            start,
            end
        }
        this.emit(PAGEEVENTS.PAGELOAD, payload)
    }
    error(name, content) {
        const payload = {
            name,
            content
        }
        this.emit(PAGEEVENTS.ERROR, payload)
    }
}

ee(Pages.prototype)

export const pages = new Pages()
