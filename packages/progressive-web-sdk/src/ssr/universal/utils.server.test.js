/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import * as utils from './utils'
import {proxyConfigs} from '../../utils/ssr-shared'

describe('getProxyConfigs (server-side)', () => {
    test('should return the currently used proxy configs', () => {
        expect(utils.getProxyConfigs()).toEqual(proxyConfigs)
    })
})
