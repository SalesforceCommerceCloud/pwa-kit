/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useHistory} from 'react-router-dom'
import {rebuildPathWithParams} from '../utils/url'

/**
 * A hook to preserve query param on history's `push` and `replace`
 *
 * @param preserve {object} - contains key-value for url query param
 * @returns {function(*=, *=, ...[*]): void} - returns a navigate function that passes args to history
 */
const usePreserveParamsHistory = (preserve = {}) => {
    const history = useHistory()

    return (path, action = 'push', ...args) => {
        const _path = rebuildPathWithParams(path, preserve)
        history[action](_path, ...args)
    }
}

export default usePreserveParamsHistory
