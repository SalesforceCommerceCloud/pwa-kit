/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
