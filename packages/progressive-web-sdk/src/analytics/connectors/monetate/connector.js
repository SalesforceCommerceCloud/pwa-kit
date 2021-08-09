/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from '../connector'

export default class Monetate extends Connector {
    constructor(displayName = 'Monetate', tagUrl, options) {
        super(displayName, options)

        if (!tagUrl) {
            throw new Error(`tagUrl cannot be undefined`)
        }

        this.monetateSelectors = ['div[id*="monetate_selector"]']

        window.monetateQ = window.monetateQ || []

        /* istanbul ignore next */
        Connector.loadScript(
            `${location.protocol === `https:` ? `https://s` : `http://`}${tagUrl}`,
            this
        )
    }

    pageviewEvent() {
        // Clean monetate injected elements
        const monetateInserts = document.querySelectorAll(this.monetateSelectors.join(','))
        monetateInserts.forEach((insertedElement) => {
            insertedElement.remove()
        })

        // We _don't_ clean up any styles that may have been injected
        // as monetate doesn't re-add them when we re-run experiments (below)
        // As a result, marketers using Monetate with a PWA will have
        // to work within the following limitations:
        //  1) Use selectors that correctly applies only to the elements
        //     they want to style on _only_ the pages they want to apply to.
        //  2) URL-based guards cannot be used as we cannot add/remove
        //     these custom CSS styles on soft navigations.

        // Run Monetate Experiment (after cleanup)
        this.send(['trackData'])
    }

    send(...args) {
        window.monetateQ.push(args)
    }
}
