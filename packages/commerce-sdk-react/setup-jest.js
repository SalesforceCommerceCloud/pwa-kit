/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import '@testing-library/jest-dom'
import {configure} from '@testing-library/dom'

// Default testing library timeout is too short for serial network calls
configure({
    asyncUtilTimeout: 10000
})
