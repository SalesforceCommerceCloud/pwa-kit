/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
const fetch = require('jest-fetch-mock')
require('regenerator-runtime/runtime')

// Mock Fetch
global.fetch = fetch
