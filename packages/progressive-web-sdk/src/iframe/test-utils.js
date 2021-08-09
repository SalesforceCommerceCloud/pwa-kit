/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {KEY_IS_MOBIFY, VALUE_IS_MOBIFY} from './common'

export const createMockEvent = (eventName, data) =>
    JSON.stringify({
        eventName,
        data,
        [KEY_IS_MOBIFY]: VALUE_IS_MOBIFY
    })
