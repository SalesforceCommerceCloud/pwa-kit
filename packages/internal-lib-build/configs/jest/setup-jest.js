/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import 'raf/polyfill' // fix requestAnimationFrame issue with polyfill
import fetch from 'jest-fetch-mock'
import 'regenerator-runtime/runtime'

// Mock Fetch
global.fetch = fetch
