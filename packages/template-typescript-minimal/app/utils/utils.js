/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const getMediaLink = (url) => {
    return url.startsWith('/cms/')
        ? new URL(`https://trialorgsforu-24b.test1.lightning.pc-rnd.force.com${url}`)
        : url
}
