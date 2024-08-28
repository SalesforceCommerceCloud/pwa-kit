/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Returns the express app configuration file in object form that was serialized on the window object
 *
 * @returns - the application configuration object.
 */
/* istanbul ignore next */
export const getConfig = () => {
    return window.__CONFIG__
}
