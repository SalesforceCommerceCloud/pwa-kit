/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './phone-utils'

test('formats a phone number', () => {
    expect(utils.formatPhoneNumber()).toBeUndefined()
    expect(utils.formatPhoneNumber('')).toEqual('')
    expect(utils.formatPhoneNumber('727')).toEqual('727')
    expect(utils.formatPhoneNumber('727555')).toEqual('(727) 555')
    expect(utils.formatPhoneNumber('7275551234')).toEqual('(727) 555-1234')
})
