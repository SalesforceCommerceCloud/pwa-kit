/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import DataObject from './data-object'

export default class Page extends DataObject {
    static get PATH() {
        return 'path'
    } // Relative url to domain (ie. '/cart')
    static get LOCATION() {
        return 'location'
    } // Url with protocol, parameter, and hash (ie. 'https://www.example.com/cart?coupon=yay')
    static get TITLE() {
        return 'title'
    }
    static get TEMPLATENAME() {
        return 'templateName'
    } // Template name

    constructor(fields, additionalRequiredFields, keyMap, keepExtraFields = true) {
        super(
            [],
            [Page.PATH, Page.LOCATION, Page.TITLE, Page.TEMPLATENAME],
            fields,
            keepExtraFields
        )

        this.isValid(additionalRequiredFields, keyMap)

        return this.build(keyMap)
    }
}
