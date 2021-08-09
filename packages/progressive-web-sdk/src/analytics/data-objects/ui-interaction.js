/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import DataObject from './data-object'

export default class UIInteraction extends DataObject {
    static get SUBJECT() {
        return 'subject'
    } // Ex. User
    static get ACTION() {
        return 'action'
    } // Ex. Open
    static get OBJECT() {
        return 'object'
    } // Ex. Modal
    static get NAME() {
        return 'name'
    }
    static get CONTENT() {
        return 'content'
    }

    constructor(fields, additionalRequiredFields, keyMap, keepExtraFields = true) {
        super(
            [UIInteraction.SUBJECT, UIInteraction.OBJECT, UIInteraction.ACTION],
            [UIInteraction.NAME, UIInteraction.CONTENT],
            fields,
            keepExtraFields
        )

        this.isValid(additionalRequiredFields, keyMap)

        return this.build(keyMap)
    }
}
