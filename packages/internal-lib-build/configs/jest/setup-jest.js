/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-env jest */

import 'raf/polyfill' // fix requestAnimationFrame issue with polyfill
import fetch from 'jest-fetch-mock'
import 'regenerator-runtime/runtime'

// Mock Fetch
global.fetch = fetch

/**
 * Jest setup to handle Node.js built-in modules with 'node:' prefix.
 *
 * Problem: The AWS SDK (which uses parse5 internally) tries to import Node.js built-ins
 * using the 'node:' prefix (e.g., require('node:stream')), but Jest cannot resolve
 * these imports and throws "ENOENT: no such file or directory, open 'node:stream'".
 *
 * Solution: Mock the 'node:' prefixed imports to point to the standard Node.js modules.
 * This allows Jest to properly resolve these imports during testing.
 *
 * Related issue: https://github.com/inikulin/parse5/issues/1260
 */
jest.mock('node:stream', () => require('stream'))
jest.mock('node:util', () => require('util'))
jest.mock('node:path', () => require('path'))
jest.mock('node:fs', () => require('fs'))
jest.mock('node:fs/promises', () => require('fs/promises'))
jest.mock('node:buffer', () => require('buffer'))
jest.mock('node:events', () => require('events'))
jest.mock('node:http', () => require('http'))
jest.mock('node:https', () => require('https'))
jest.mock('node:crypto', () => require('crypto'))
jest.mock('node:os', () => require('os'))
jest.mock('node:url', () => require('url'))
jest.mock('node:zlib', () => require('zlib'))
