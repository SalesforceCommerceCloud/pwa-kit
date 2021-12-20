/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * mocking return of this functions for reusing across different tests
 * @returns {{hostname: [string], alias: string, id: string}}
 */
const useSite = () => {
    return {
        id: 'site-id-2',
        alias: 'site-alias-2',
        hostname: ['localhost']
    }
}

export default useSite
