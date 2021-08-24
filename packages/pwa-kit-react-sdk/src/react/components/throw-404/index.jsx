/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import * as errors from '../../../utils/errors'

/**
 * This is designed to be put into a react-router config as a fallback
 * with path="*", simply to trigger the normal error handling code we have.
 * As a result, this component should never be rendered – it should
 * trigger the error page instead.
 *
 * @private
 */
class Throw404 extends React.Component {
    static getProps() {
        throw new errors.HTTPNotFound('Not found')
    }
    render() {
        // This should be unreachable
        return <div />
    }
}

export default Throw404
