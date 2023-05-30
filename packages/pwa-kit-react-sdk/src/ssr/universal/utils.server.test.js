/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Jest requires the @jest-environment comment at the start of file, which
// conflicts with the eslint header rule.
/* eslint-disable header/header */

import * as utils from './utils'
import {proxyConfigs} from '@salesforce/pwa-kit-runtime/utils/ssr-shared'

describe('getProxyConfigs (server-side)', () => {
    test('should return the currently used proxy configs', () => {
        expect(utils.getProxyConfigs()).toEqual(proxyConfigs)
    })
})
