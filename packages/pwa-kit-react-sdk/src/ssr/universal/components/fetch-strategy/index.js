/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

/**
 * @private
 */
export class FetchStrategy extends React.Component {
    /**
     * @private
     */
    static async initAppState(args) {
        try {
            const promises = this.getInitializers().map((fn) => fn(args))
            return {
                error: undefined,
                appState: Object.assign({}, ...(await Promise.all(promises)))
            }
        } catch (error) {
            return {
                error: error || new Error(),
                appState: {}
            }
        }
    }
}
