/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as utils from './utils'
import {proxyConfigs} from 'pwa-kit-runtime/utils/ssr-shared'

describe('getProxyConfigs (server-side)', () => {
    test('should return the currently used proxy configs', () => {
        expect(utils.getProxyConfigs()).toEqual(proxyConfigs)
    })
})
