/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const getMediaLink = (url) => {
    return url.includes('/cms/')
        ? new URL(
              `https://codeceptscomorgmain-1845e05c6e8.test1.pc-rnd.force.com/b2cstore/sfsites/c${url}`
          )
        : url
}
export const debounce = (fn, delay) => {
    let timerId
    return (...args) => {
        clearTimeout(timerId)
        timerId = setTimeout(() => fn(...args), delay)
    }
}
