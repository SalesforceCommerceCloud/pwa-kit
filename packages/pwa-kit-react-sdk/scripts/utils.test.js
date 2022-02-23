/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const Utils = require('./utils')

let realFail
beforeEach(() => {
    realFail = Utils.fail
    Utils.fail = jest.fn()
})

afterEach(() => {
    Utils.fail = realFail
})

