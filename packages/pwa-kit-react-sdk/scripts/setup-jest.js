/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import 'raf/polyfill' // fix requestAnimationFrame issue with polyfill
import Enzyme from 'enzyme'

// DANGEROUS: this enzyme React 17 adapter is unofficial
// because the official adaptor is still in development
// see https://github.com/enzymejs/enzyme/issues/2429
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'
import fetch from 'jest-fetch-mock'

Enzyme.configure({adapter: new Adapter()})

// Mock Fetch
global.fetch = fetch
